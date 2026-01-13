import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getActiveQuests } from "@/lib/bitgalaxy/getActiveQuests";
import { getPlayer } from "@/lib/bitgalaxy/getPlayer";
import { getRankProgress } from "@/lib/bitgalaxy/rankEngine";
import { ensureArcadeQuestExists } from "@/lib/bitgalaxy/ensureArcadeQuestExists";
import { updateXP } from "@/lib/bitgalaxy/updateXP";
import { writeAuditLog } from "@/lib/bitgalaxy/auditLog";
import { getISOWeekKey } from "@/lib/weekKey";

export const runtime = "nodejs";

type LevelDef = { label?: string; xp: number; description?: string };

function xpForLevel(
  level: number,
  levels?: LevelDef[] | null,
  fallbackBase = 50,
) {
  const lvl = Math.max(1, Math.min(3, Math.floor(level || 1)));

  if (Array.isArray(levels) && levels.length >= lvl) {
    const v = Number(levels[lvl - 1]?.xp || 0);
    return Math.max(0, Math.floor(v));
  }

  // fallback if quest doc not configured
  if (lvl === 1) return fallbackBase;
  if (lvl === 2) return fallbackBase * 2;
  return fallbackBase * 3;
}

function clampInt(n: any, fallback = 0) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(0, Math.floor(v));
}

/**
 * Score → tier mapping:
 * - configurable in quest doc: questData.meta.scoreThresholds = [tier1Min, tier2Min, tier3Min]
 * - fallback thresholds tuned to your runner scoring rate
 */
function tierForScore(score: number, thresholds: number[]) {
  const s = Math.max(0, Math.floor(score || 0));
  const t1 = Math.max(0, Math.floor(thresholds[0] ?? 750));
  const t2 = Math.max(0, Math.floor(thresholds[1] ?? 2500));
  const t3 = Math.max(0, Math.floor(thresholds[2] ?? 7500));

  if (s < t1) return 0;
  if (s >= t3) return 3;
  if (s >= t2) return 2;
  return 1;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orgId = body.orgId as string | undefined;
    const targetUserId = body.userId as string | undefined;

    const score = clampInt(body.score, 0);

    const stats = body.stats as
      | {
          timeMs?: number;
          jumps?: number;
          speedups?: number;
        }
      | undefined;

    if (!orgId || !targetUserId) {
      return NextResponse.json(
        { error: "Missing orgId or userId" },
        { status: 400 },
      );
    }

    const questId = "lunchbox-run";

    // Make sure quest exists
    await ensureArcadeQuestExists(orgId, questId, {
      title: "Neon Lunchbox Run – Arcade Mission",
      description:
        "Sprint the synthwave grid. Jump over neon hazards. Survive long enough to claim your XP.",
      xp: 50,
      // Optional (you can later store these in Firestore instead)
      // meta: { scoreThresholds: [250, 900, 1800] },
    });

    const questSnap = await adminDb
      .collection("orgs")
      .doc(orgId)
      .collection("bitgalaxyQuests")
      .doc(questId)
      .get();

    const questData = (questSnap.data() || {}) as any;

    const configuredLevels: LevelDef[] | null =
      (questData.levels as LevelDef[] | undefined) ??
      (questData.meta?.levels as LevelDef[] | undefined) ??
      null;

    const baseXP = Number(questData.xp || 50);

    const scoreThresholds: number[] =
      (Array.isArray(questData.meta?.scoreThresholds)
        ? questData.meta.scoreThresholds
        : null) ?? [250, 900, 1800];

    const weekKey = getISOWeekKey(new Date());

    const playerRef = adminDb
      .collection("orgs")
      .doc(orgId)
      .collection("bitgalaxyPlayers")
      .doc(targetUserId);

    const now = FieldValue.serverTimestamp() as Timestamp;

    let xpAwarded = 0;
    let newBestTier = 0;

    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(playerRef);
      if (!snap.exists) {
        throw new Error(`Player ${targetUserId} does not exist in org ${orgId}`);
      }

      const data = (snap.data() || {}) as any;
      const completedQuestIds: string[] = data.completedQuestIds ?? [];

      const specialEvents = (data.specialEvents || {}) as any;
      const lbr = (specialEvents.lunchboxRun || {}) as {
        weekKey?: string;
        bestTier?: number;
        bestScore?: number | null;
        bestScoreAllTime?: number | null;
        runs?: number | null;
      };

      const prevWeekKey = String(lbr.weekKey || "");
      const prevBestTier =
        prevWeekKey === weekKey ? Number(lbr.bestTier || 0) : 0;

      const requestedTier = tierForScore(score, scoreThresholds);

      if (requestedTier <= 0) {
        throw new Error("LUNCHBOX_RUN_SCORE_TOO_LOW");
      }

      if (requestedTier <= prevBestTier) {
        throw new Error("LUNCHBOX_RUN_TIER_ALREADY_RECORDED");
      }

      const prevXP = xpForLevel(prevBestTier, configuredLevels, baseXP);
      const nextXP = xpForLevel(requestedTier, configuredLevels, baseXP);

      xpAwarded = Math.max(0, nextXP - prevXP);
      if (xpAwarded <= 0) {
        throw new Error("LUNCHBOX_RUN_NO_XP_DELTA");
      }

      const timeMs = typeof stats?.timeMs === "number" ? clampInt(stats.timeMs) : null;
      const jumps = typeof stats?.jumps === "number" ? clampInt(stats.jumps) : null;
      const speedups =
        typeof stats?.speedups === "number" ? clampInt(stats.speedups) : null;

      const prevBestScore =
        prevWeekKey === weekKey ? Number(lbr.bestScore ?? 0) : 0;

      const prevBestAllTime = Number(lbr.bestScoreAllTime ?? 0);

      const nextBestScore = Math.max(prevBestScore || 0, score);
      const nextBestAllTime = Math.max(prevBestAllTime || 0, score);

      newBestTier = requestedTier;

      const nextCompleted = completedQuestIds.includes(questId)
        ? completedQuestIds
        : [...completedQuestIds, questId];

      tx.set(
        playerRef,
        {
          completedQuestIds: nextCompleted,
          specialEvents: {
            ...specialEvents,
            lunchboxRun: {
              weekKey,
              bestTier: requestedTier,
              bestScore: nextBestScore,
              bestScoreAllTime: nextBestAllTime,
              runs: (Number(lbr.runs ?? 0) + 1),
              lastResult: {
                tier: requestedTier,
                score,
                timeMs,
                jumps,
                speedups,
              },
            },
          },
          updatedAt: now,
        },
        { merge: true },
      );
    });

    // XP + rank/level
    await updateXP(orgId, targetUserId, xpAwarded, {
      source: "lunchbox_run_tier",
      questId,
      meta: { weekKey, tier: newBestTier, score },
    });

    await writeAuditLog(orgId, targetUserId, {
      eventType: "arcade_tier_complete",
      questId,
      xpChange: xpAwarded,
      source: "lunchbox_run",
      meta: { weekKey, tier: newBestTier, score, stats: stats ?? null },
    });

    const [activeQuests, player] = await Promise.all([
      getActiveQuests(orgId, targetUserId),
      getPlayer(orgId, targetUserId),
    ]);

    const progress = getRankProgress(player.totalXP);

    return NextResponse.json({
      success: true,
      weekKey,
      tier: newBestTier,
      xpAwarded,
      activeQuests,
      player: {
        userId: player.userId,
        orgId: player.orgId,
        totalXP: player.totalXP,
        rank: player.rank,
        level: (player as any).level ?? 1,
        weeklyXP: (player as any).weeklyXP ?? 0,
        weeklyWeekKey: (player as any).weeklyWeekKey ?? "",
        progress,
      },
    });
  } catch (error: any) {
    console.error("BitGalaxy complete-lunchbox-run error:", error);

    if (error?.message === "LUNCHBOX_RUN_SCORE_TOO_LOW") {
      return NextResponse.json(
        {
          error:
            "Run too short to record. Survive a bit longer to unlock Tier 1 and earn XP.",
        },
        { status: 409 },
      );
    }

    if (error?.message === "LUNCHBOX_RUN_TIER_ALREADY_RECORDED") {
      return NextResponse.json(
        {
          error:
            "Tier already recorded this week. Beat your best run to earn more XP.",
        },
        { status: 409 },
      );
    }

    if (error?.message === "LUNCHBOX_RUN_NO_XP_DELTA") {
      return NextResponse.json(
        {
          error:
            "No XP change for this tier. You’ve already logged an equal or better performance.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: error?.message ?? "Failed to complete Lunchbox Run quest",
      },
      { status: 500 },
    );
  }
}