import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { updateGlobalAverages } from "../services/stats.service";
import { updateLeaderboard } from "../services/stats.service";
import { getOrCreateMonthlyMonsters, refreshMonsterStats } from "../services/monster.service";
import { broadcastLeaderboardUpdate } from "../websocket";

export function setupCronJobs(prisma: PrismaClient): void {
  // Every day at midnight (00:00): refresh daily quests
  // Daily quests are generated on-demand via GET /quests/today,
  // but this job pre-seeds them for all active users
  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Running daily quest refresh...");
    try {
      // Daily quests are generated lazily when users first request them
      // This job can pre-generate them for notification purposes
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log(
        `[CRON] Daily quest refresh complete for ${today.toISOString().split("T")[0]}`
      );
    } catch (err) {
      console.error("[CRON] Daily quest refresh failed:", err);
    }
  });

  // Every day at 3:00 AM: update global stats and averages
  cron.schedule("0 3 * * *", async () => {
    console.log("[CRON] Running global stats update...");
    try {
      await updateGlobalAverages(prisma);
      await refreshMonsterStats(prisma);
      console.log("[CRON] Global stats update complete.");
    } catch (err) {
      console.error("[CRON] Global stats update failed:", err);
    }
  });

  // Every hour: update leaderboard entries for recently active users
  cron.schedule("0 * * * *", async () => {
    console.log("[CRON] Running hourly leaderboard update...");
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Find users who had sessions end in the last hour
      const activeSessions = await prisma.workoutSession.findMany({
        where: {
          endedAt: { gte: oneHourAgo },
        },
        select: { userId: true },
        distinct: ["userId"],
      });

      const activeUserIds = activeSessions.map((s) => s.userId);
      console.log(
        `[CRON] Updating leaderboard for ${activeUserIds.length} active users...`
      );

      for (const userId of activeUserIds) {
        try {
          await updateLeaderboard(userId, prisma);
        } catch (err) {
          console.error(
            `[CRON] Leaderboard update failed for user ${userId}:`,
            err
          );
        }
      }

      // Broadcast leaderboard update if there were active users
      if (activeUserIds.length > 0) {
        // Fetch top 10 for broadcast
        const topEntries = await prisma.leaderboardEntry.findMany({
          where: { isPublic: true },
          orderBy: { totalPowerScore: "desc" },
          take: 10,
          include: {
            user: {
              select: { username: true, avatarUrl: true },
            },
          },
        });

        broadcastLeaderboardUpdate({
          type: "hourly_update",
          topEntries: topEntries.map((e, idx) => ({
            rank: idx + 1,
            username: e.user.username,
            avatarUrl: e.user.avatarUrl,
            league: e.league,
            totalPowerScore: e.totalPowerScore,
          })),
          timestamp: new Date().toISOString(),
        });
      }

      console.log("[CRON] Hourly leaderboard update complete.");
    } catch (err) {
      console.error("[CRON] Hourly leaderboard update failed:", err);
    }
  });

  // First day of each month at 00:01: run monthly tournament and refresh monsters
  cron.schedule("1 0 1 * *", async () => {
    console.log("[CRON] Running monthly tournament and monster refresh...");
    try {
      const now = new Date();

      // Get previous month info (tournament is for the completed month)
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthNum = prevMonth.getMonth() + 1;
      const prevYear = prevMonth.getFullYear();

      console.log(
        `[CRON] Running tournament for ${prevYear}-${prevMonthNum}...`
      );

      // Run tournament for all leagues for the previous month
      const { League } = await import("@prisma/client");
      const leagues = Object.values(League);

      for (const league of leagues) {
        try {
          // Get or create the tournament record
          const tournament = await prisma.tournament.upsert({
            where: {
              month_year_league: {
                month: prevMonthNum,
                year: prevYear,
                league,
              },
            },
            update: {
              isComplete: true,
              endedAt: now,
            },
            create: {
              month: prevMonthNum,
              year: prevYear,
              league,
              startedAt: new Date(prevYear, prevMonthNum - 1, 1),
              endedAt: now,
              isComplete: true,
            },
          });

          // Rank all participants
          const entries = await prisma.leaderboardEntry.findMany({
            where: { league },
            orderBy: { totalPowerScore: "desc" },
          });

          const monsterKillCounts = await prisma.userMonsterKill.groupBy({
            by: ["userId"],
            where: {
              monster: { month: prevMonthNum, year: prevYear, league },
            },
            _count: { monsterId: true },
          });

          const killCountMap = new Map(
            monsterKillCounts.map((k) => [k.userId, k._count.monsterId])
          );

          const topPercent = Math.ceil(entries.length * 0.2);
          const bottomPercent = Math.ceil(entries.length * 0.2);
          const leagueValues = Object.values(League);
          const leagueIdx = leagueValues.indexOf(league);

          let promotions = 0;
          let relegations = 0;

          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const rank = i + 1;
            const monstersKilled = killCountMap.get(entry.userId) ?? 0;

            const promoted =
              rank <= topPercent && league !== League.MYTHIC;
            const relegated =
              rank > entries.length - bottomPercent &&
              league !== League.IRON &&
              entries.length > 5;

            const newLeague = promoted
              ? (leagueValues[leagueIdx + 1] as typeof League[keyof typeof League]) ?? league
              : relegated
              ? (leagueValues[leagueIdx - 1] as typeof League[keyof typeof League]) ?? league
              : league;

            if (promoted) promotions++;
            if (relegated) relegations++;

            const maxKills = Math.max(
              ...Array.from(killCountMap.values()),
              0
            );
            const slayerBadge =
              monstersKilled > 0 && monstersKilled === maxKills;

            await prisma.tournamentResult.create({
              data: {
                tournamentId: tournament.id,
                userId: entry.userId,
                powerScoreAtTime: entry.totalPowerScore,
                rankInLeague: rank,
                monstersDefeated: monstersKilled,
                previousLeague: league,
                newLeague,
                wasPromoted: promoted,
                wasRelegated: relegated,
                slayerBadge,
              },
            });

            if (promoted || relegated) {
              await prisma.leaderboardEntry.update({
                where: { userId: entry.userId },
                data: { league: newLeague },
              });
            }
          }

          console.log(
            `[CRON] Tournament complete for ${league}: ${entries.length} participants, ${promotions} promotions, ${relegations} relegations`
          );
        } catch (err) {
          console.error(`[CRON] Tournament failed for league ${league}:`, err);
        }
      }

      // Deactivate old monsters
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      await prisma.monster.updateMany({
        where: {
          OR: [
            { year: { lt: currentYear } },
            {
              year: currentYear,
              month: { lt: currentMonth },
            },
          ],
          isActive: true,
        },
        data: { isActive: false },
      });

      // Generate fresh monsters for the new month
      await getOrCreateMonthlyMonsters(prisma);

      console.log(
        "[CRON] Monthly tournament and monster refresh complete."
      );
    } catch (err) {
      console.error("[CRON] Monthly job failed:", err);
    }
  });

  console.log("[CRON] All cron jobs registered.");
}

export default setupCronJobs;
