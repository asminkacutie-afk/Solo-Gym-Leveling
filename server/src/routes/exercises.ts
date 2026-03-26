import { Router, Request, Response, NextFunction } from "express";
import { query, param, validationResult } from "express-validator";
import { PrismaClient, Discipline } from "@prisma/client";
import { authenticate, optionalAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();
const prisma = new PrismaClient();

// GET /api/exercises — search by name and filter by discipline
router.get(
  "/",
  optionalAuth,
  [
    query("name").optional().isString().trim(),
    query("discipline").optional().isIn(Object.values(Discipline)),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
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

    const nameQuery = (req.query.name as string | undefined)?.trim();
    const disciplineFilter = req.query.discipline as Discipline | undefined;
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const limit = parseInt((req.query.limit as string) ?? "20", 10);
    const skip = (page - 1) * limit;

    const where = {
      ...(nameQuery ? { name: { contains: nameQuery, mode: "insensitive" as const } } : {}),
      ...(disciplineFilter ? { discipline: disciplineFilter } : {}),
    };

    try {
      const [exercises, total] = await Promise.all([
        prisma.exercise.findMany({
          where,
          orderBy: { name: "asc" },
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            discipline: true,
            category: true,
            muscleGroups: true,
            description: true,
            isBuiltIn: true,
          },
        }),
        prisma.exercise.count({ where }),
      ]);

      res.json({
        exercises,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/exercises/disciplines/:discipline — all exercises for a discipline
router.get(
  "/disciplines/:discipline",
  [
    param("discipline")
      .isIn(Object.values(Discipline))
      .withMessage("Invalid discipline"),
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

    const discipline = req.params.discipline as Discipline;

    try {
      const exercises = await prisma.exercise.findMany({
        where: { discipline },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          discipline: true,
          category: true,
          muscleGroups: true,
          description: true,
          isBuiltIn: true,
        },
      });

      res.json({ exercises, discipline });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/exercises/:id — single exercise with optional personal record
router.get(
  "/:id",
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const exercise = await prisma.exercise.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          name: true,
          discipline: true,
          category: true,
          muscleGroups: true,
          description: true,
          isBuiltIn: true,
        },
      });

      if (!exercise) {
        next(createError("Exercise not found.", 404, "NotFound"));
        return;
      }

      let personalRecord = null;
      if (req.user) {
        personalRecord = await prisma.personalRecord.findUnique({
          where: {
            userId_exerciseId: {
              userId: req.user.userId,
              exerciseId: req.params.id,
            },
          },
          select: {
            weight: true,
            reps: true,
            oneRepMax: true,
            recordedAt: true,
          },
        });
      }

      res.json({ exercise, personalRecord });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
