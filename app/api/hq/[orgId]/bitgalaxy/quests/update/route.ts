import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireUser, requireRole } from "@/lib/auth-server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export const runtime = "nodejs";

type Params = { orgId: string };

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<Params> },
) {
  try {
    const { orgId } = await ctx.params;

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing orgId in route" },
        { status: 400 },
      );
    }

    // --- AUTH ---
    const user = await requireUser(req);
    await requireRole(orgId, user.uid, ["owner"], req);

    const body = await req.json();

    // QuestForm sends "questId"; keep "id" as a fallback for safety
    const questId =
      (body.questId as string | undefined) ??
      (body.id as string | undefined);

    if (!questId) {
      return NextResponse.json(
        { error: "Quest id (questId or id) is required" },
        { status: 400 },
      );
    }

    const questRef = adminDb
      .collection("orgs")
      .doc(orgId)
      .collection("bitgalaxyQuests")
      .doc(questId);

    const now = FieldValue.serverTimestamp() as Timestamp;

    const updateData: Record<string, any> = {
      updatedAt: now,
    };

    // 🔹 NEW – handle loyaltyReward explicitly
    if ("loyaltyReward" in body) {
      const rawLoyalty = body.loyaltyReward ?? {};
      const loyaltyEnabled = !!rawLoyalty.enabled;
      const loyaltyPoints =
        loyaltyEnabled &&
        typeof rawLoyalty.pointsPerCompletion === "number"
          ? Math.max(0, Number(rawLoyalty.pointsPerCompletion))
          : 0;

      updateData.loyaltyReward = {
        enabled: loyaltyEnabled,
        pointsPerCompletion: loyaltyPoints,
      };
    }

    const allowedFields = [
      "title",
      "description",
      "programId",
      "type",
      "xp",
      "isActive",
      "maxCompletionsPerUser",
      "checkinCode",
      "requiresStaffApproval",
      "metadata",
    ];

    for (const field of allowedFields) {
      if (!(field in body)) continue;

      // xp numeric normalization
      if (field === "xp") {
        updateData[field] = Number(body[field]);
        continue;
      }

      // maxCompletionsPerUser numeric OR null
      if (field === "maxCompletionsPerUser") {
        const value = body[field];
        updateData[field] =
          typeof value === "number" ? value : null;
        continue;
      }

      updateData[field] = body[field];
    }

    await questRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("BitGalaxy HQ update quest error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to update quest" },
      { status: 500 },
    );
  }
}