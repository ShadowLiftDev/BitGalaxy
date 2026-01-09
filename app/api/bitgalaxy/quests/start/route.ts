import { NextRequest, NextResponse } from "next/server";

import { startQuest } from "@/lib/bitgalaxy/startQuest";
import { getActiveQuests } from "@/lib/bitgalaxy/getActiveQuests";
import { getQuest } from "@/lib/bitgalaxy/getQuest";
import { getPlayer } from "@/lib/bitgalaxy/getPlayer";
import { getRankProgress } from "@/lib/bitgalaxy/rankEngine";
import { requirePlayerSession } from "@/lib/bitgalaxy/playerSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const orgId = body.orgId as string | undefined;
    const questId = body.questId as string | undefined;

    if (!orgId || !questId) {
      return NextResponse.json(
        { success: false, error: "Missing orgId or questId" },
        { status: 400 },
      );
    }

    // 🔐 Use the player session cookie (minted by lookup-player)
    const session = requirePlayerSession(req);

    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "No player session found" },
        { status: 401 },
      );
    }

    if (session.orgId !== orgId) {
      return NextResponse.json(
        {
          success: false,
          error: "Session org does not match requested orgId",
        },
        { status: 403 },
      );
    }

    const playerId = session.userId;

    // 1) mark quest as started / active for this player
    await startQuest(orgId, playerId, questId);

    // 2) load updated player + quest + active quests for HUD refresh
    const [player, quest, activeQuests] = await Promise.all([
      getPlayer(orgId, playerId),
      getQuest(orgId, questId),
      getActiveQuests(orgId, playerId),
    ]);

    if (!player) {
      return NextResponse.json(
        {
          success: false,
          error: "Player not found after starting quest",
        },
        { status: 404 },
      );
    }

    const totalXP =
      typeof (player as any)?.totalXP === "number"
        ? (player as any).totalXP
        : (typeof (player as any)?.xp === "number"
            ? (player as any).xp
            : 0);

    const rank = getRankProgress(totalXP);

    return NextResponse.json({
      success: true,
      orgId,
      questId,
      playerId,
      player,
      quest,
      activeQuests,
      rank,
    });
  } catch (err: any) {
    console.error("BitGalaxy start-quest error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to start quest",
      },
      { status: 500 },
    );
  }
}