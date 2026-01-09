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

    const questsCol = adminDb
      .collection("orgs")
      .doc(orgId)
      .collection("bitgalaxyQuests");

    const now = FieldValue.serverTimestamp() as Timestamp;

    // NEW – normalize loyaltyReward from body
    const rawLoyalty = body.loyaltyReward ?? {};
    const loyaltyEnabled = !!rawLoyalty.enabled;
    const loyaltyPoints =
      loyaltyEnabled && typeof rawLoyalty.pointsPerCompletion === "number"
        ? Math.max(0, Number(rawLoyalty.pointsPerCompletion))
        : 0;

    // 🔹 NEW – derive a safe ID from the quest title
    const rawTitle = (body.title ?? "Untitled Quest").toString().trim();
    const baseId =
      rawTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")      // non-alphanumerics → "-"
        .replace(/^-+|-+$/g, "") || "quest"; // trim leading/trailing "-"

    let docRef = questsCol.doc(baseId);
    const existing = await docRef.get();

    if (existing.exists) {
      // If a quest with this name already exists, fall back to auto-ID
      docRef = questsCol.doc();
    }

    const questData = {
      title: rawTitle || "Untitled Quest",
      description: body.description ?? "",
      orgId,
      programId: body.programId ?? null,
      type: body.type ?? "custom",
      xp: Number(body.xp ?? 0),
      isActive: body.isActive ?? true,
      maxCompletionsPerUser:
        typeof body.maxCompletionsPerUser === "number"
          ? body.maxCompletionsPerUser
          : null,
      checkinCode: body.checkinCode ?? null,
      requiresStaffApproval: body.requiresStaffApproval ?? false,
      metadata: body.metadata ?? {},

      // loyalty reward config
      loyaltyReward: {
        enabled: loyaltyEnabled,
        pointsPerCompletion: loyaltyPoints,
      },

      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(questData);

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error("BitGalaxy HQ create quest error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create quest" },
      { status: 500 },
    );
  }
}