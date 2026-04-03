import { Router, Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { authenticate } from "../middleware/auth";
import prisma from "../lib/prisma";
import {
  getCompositionMultiplier,
  checkBFLeagueGate,
  getLatestBodyComp,
} from "../services/composition.service";
import { League } from "@prisma/client";

const router = Router();

router.use(authenticate);

// POST /api/body-composition — log new body composition entry
router.post(
  "/",
  [
    body("weight").isFloat({ min: 20, max: 400 }).withMessage("Weight must be between 20 and 400"),
    body("bodyFat").isFloat({ min: 2, max: 70 }).withMessage("Body fat must be between 2 and 70"),
    body("method").optional().isIn(["manual", "dexa", "navy", "bioimpedance", "calipers"]),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: "ValidationError",
        message: errors.array()[0].msg,
        statusCode: 400,
      });
      return;
    }

    const { weight, bodyFat, method } = req.body as {
      weight: number;
      bodyFat: number;
      method?: string;
    };

    const userId = req.user!.userId;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { gender: true },
      });

      const lbm = weight * (1 - bodyFat / 100);
      const compositionMult = getCompositionMultiplier(
        weight,
        bodyFat,
        user?.gender ?? "male"
      );

      const entry = await prisma.bodyComposition.create({
        data: {
          userId,
          weight,
          bodyFat,
          lbm: Math.round(lbm * 100) / 100,
          method: method ?? "manual",
        },
      });

      // Check league gates
      const leaderboard = await prisma.leaderboardEntry.findUnique({
        where: { userId },
        select: { league: true },
      });

      const gates = {
        bronzeToSilver: checkBFLeagueGate(
          bodyFat,
          League.SILVER,
          user?.gender ?? "male"
        ),
        silverToGold: checkBFLeagueGate(
          bodyFat,
          League.GOLD,
          user?.gender ?? "male"
        ),
        goldToMythic: checkBFLeagueGate(
          bodyFat,
          League.MYTHIC,
          user?.gender ?? "male"
        ),
      };

      // Update composition multiplier on leaderboard entry
      await prisma.leaderboardEntry.updateMany({
        where: { userId },
        data: {
          compositionMult,
        },
      });

      res.status(201).json({
        entry,
        lbm: Math.round(lbm * 100) / 100,
        compositionMultiplier: Math.round(compositionMult * 1000) / 1000,
        currentLeague: leaderboard?.league ?? "IRON",
        gateChecks: gates,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/body-composition — last 12 weekly entries
router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.userId;

    try {
      const entries = await prisma.bodyComposition.findMany({
        where: { userId },
        orderBy: { recordedAt: "desc" },
        take: 52,
        select: {
          id: true,
          weight: true,
          bodyFat: true,
          lbm: true,
          method: true,
          recordedAt: true,
        },
      });

      res.json({ entries, total: entries.length });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/body-composition/gates — check league gate status
router.get(
  "/gates",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.userId;

    try {
      const [user, leaderboard, latestComp] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { gender: true },
        }),
        prisma.leaderboardEntry.findUnique({
          where: { userId },
          select: { league: true, totalPowerScore: true },
        }),
        getLatestBodyComp(userId, prisma),
      ]);

      if (!latestComp) {
        res.json({
          hasBodyCompData: false,
          message: "No body composition data logged yet. Log your first entry to unlock gate checks.",
          currentLeague: leaderboard?.league ?? "IRON",
          gatesStatus: null,
          recommendations: [
            "Log your body weight and body fat percentage to enable league gate checks.",
            "Body composition affects your composition multiplier and league promotion eligibility.",
          ],
        });
        return;
      }

      const gender = user?.gender ?? "male";
      const currentBF = latestComp.bodyFat;
      const currentLeague = leaderboard?.league ?? "IRON";

      const gatesStatus = {
        bronzeToSilver: checkBFLeagueGate(currentBF, League.SILVER, gender),
        silverToGold: checkBFLeagueGate(currentBF, League.GOLD, gender),
        goldToMythic: checkBFLeagueGate(currentBF, League.MYTHIC, gender),
      };

      const recommendations: string[] = [];
      const isFemale = gender.toLowerCase() === "female";

      if (!gatesStatus.bronzeToSilver.passes) {
        const threshold = isFemale ? 35 : 28;
        recommendations.push(
          `Reduce body fat by ${gatesStatus.bronzeToSilver.deficit}% to pass the Bronze→Silver gate (target: ${threshold}%)`
        );
      }
      if (!gatesStatus.silverToGold.passes) {
        const threshold = isFemale ? 30 : 22;
        recommendations.push(
          `Reduce body fat by ${gatesStatus.silverToGold.deficit}% to pass the Silver→Gold gate (target: ${threshold}%)`
        );
      }
      if (!gatesStatus.goldToMythic.passes) {
        const threshold = isFemale ? 26 : 18;
        recommendations.push(
          `Reduce body fat by ${gatesStatus.goldToMythic.deficit}% to pass the Gold→Mythic gate (target: ${threshold}%)`
        );
      }

      if (recommendations.length === 0) {
        recommendations.push(
          "You pass all body fat league gates. Keep training to increase your power score!"
        );
      }

      res.json({
        hasBodyCompData: true,
        currentBodyFat: currentBF,
        currentLBM: latestComp.lbm,
        currentLeague,
        gatesStatus,
        recommendations,
        lastUpdated: latestComp.recordedAt,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/body-composition/navy-calculator — estimate BF% using Navy method
router.post(
  "/navy-calculator",
  [
    body("neck").isFloat({ min: 20, max: 70 }).withMessage("Neck circumference in cm required"),
    body("waist").isFloat({ min: 40, max: 200 }).withMessage("Waist circumference in cm required"),
    body("height").isFloat({ min: 100, max: 250 }).withMessage("Height in cm required"),
    body("gender").isIn(["male", "female"]).withMessage("Gender must be male or female"),
    body("hip")
      .if(body("gender").equals("female"))
      .isFloat({ min: 40, max: 200 })
      .withMessage("Hip measurement required for females"),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: "ValidationError",
        message: errors.array()[0].msg,
        statusCode: 400,
      });
      return;
    }

    const { neck, waist, height, gender, hip } = req.body as {
      neck: number;
      waist: number;
      height: number;
      gender: "male" | "female";
      hip?: number;
    };

    try {
      let bodyFatPercent: number;

      if (gender === "male") {
        // US Navy formula for males (using cm, converted to inches for formula)
        const neckIn = neck / 2.54;
        const waistIn = waist / 2.54;
        const heightIn = height / 2.54;
        bodyFatPercent =
          86.01 * Math.log10(waistIn - neckIn) -
          70.041 * Math.log10(heightIn) +
          36.76;
      } else {
        // US Navy formula for females
        if (!hip) {
          res.status(400).json({
            error: "ValidationError",
            message: "Hip measurement is required for females.",
            statusCode: 400,
          });
          return;
        }
        const neckIn = neck / 2.54;
        const waistIn = waist / 2.54;
        const hipIn = hip / 2.54;
        const heightIn = height / 2.54;
        bodyFatPercent =
          163.205 * Math.log10(waistIn + hipIn - neckIn) -
          97.684 * Math.log10(heightIn) -
          78.387;
      }

      bodyFatPercent = Math.max(3, Math.min(70, bodyFatPercent));
      bodyFatPercent = Math.round(bodyFatPercent * 10) / 10;

      const compositionMult = getCompositionMultiplier(
        0,
        bodyFatPercent,
        gender
      );

      res.json({
        estimatedBodyFat: bodyFatPercent,
        method: "navy",
        gender,
        inputs: { neck, waist, height, hip: hip ?? null },
        compositionMultiplierEstimate:
          Math.round(compositionMult * 1000) / 1000,
        note: "This is an estimate. Log this value to save it to your profile.",
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
