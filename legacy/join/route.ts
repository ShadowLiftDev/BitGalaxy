import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeEmail(email?: string | null) {
  const e = (email ?? "").trim().toLowerCase();
  return e || null;
}

function normalizePhone(phone?: string | null) {
  const digits = (phone ?? "").replace(/[^\d]/g, "");
  if (!digits) return { digits: null as string | null, last10: null as string | null };
  const last10 = digits.length > 10 ? digits.slice(-10) : digits;
  return { digits, last10 };
}

function tsToMs(ts: any) {
  if (!ts) return null;
  if (typeof ts?.toMillis === "function") return ts.toMillis();
  if (typeof ts?.toDate === "function") return ts.toDate().getTime();
  return null;
}

function serializePlayer(p: any) {
  if (!p) return p;
  return {
    ...p,
    createdAt: tsToMs(p.createdAt),
    updatedAt: tsToMs(p.updatedAt),
    lastCheckinAt: tsToMs(p.lastCheckinAt),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const orgId = (body.orgId as string | undefined)?.trim();
    const firstName = (body.firstName as string | undefined)?.trim();
    const lastName = (body.lastName as string | undefined)?.trim();

    // IMPORTANT: allow uid/userId from auth flow so docId matches UID
    const uid =
      (body.userId as string | undefined)?.trim() ||
      (body.uid as string | undefined)?.trim() ||
      null;

    const email = normalizeEmail(body.email);
    const phoneRaw = (body.phone as string | undefined)?.trim() ?? null;
    const phoneNorm = normalizePhone(phoneRaw);

    if (!orgId) {
      return NextResponse.json({ success: false, error: "Missing orgId" }, { status: 400 });
    }

    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: "First and last name are required" },
        { status: 400 },
      );
    }

    if (!email && !phoneRaw) {
      return NextResponse.json(
        { success: false, error: "At least a phone or email is required" },
        { status: 400 },
      );
    }

    const playersCol = adminDb.collection("orgs").doc(orgId).collection("bitgalaxyPlayers");

    // 🔍 reuse existing by email/phone
    let existingSnap: FirebaseFirestore.QueryDocumentSnapshot | null = null;

    if (email) {
      const byEmail = await playersCol.where("email", "==", email).limit(1).get();
      if (!byEmail.empty) existingSnap = byEmail.docs[0];
    }

    if (!existingSnap && phoneRaw) {
      // try both raw + normalized last10
      const tries = [
        { field: "phone", value: phoneRaw },
        { field: "phone", value: phoneNorm.last10 },
        { field: "phoneNormalized", value: phoneNorm.last10 },
        { field: "phoneDigits", value: phoneNorm.digits },
      ];

      for (const t of tries) {
        if (!t.value) continue;
        const snap = await playersCol.where(t.field, "==", t.value).limit(1).get();
        if (!snap.empty) {
          existingSnap = snap.docs[0];
          break;
        }
      }
    }

    if (existingSnap) {
      const data = existingSnap.data() as any;
      return NextResponse.json({
        success: true,
        userId: existingSnap.id,
        player: serializePlayer({ ...data, userId: existingSnap.id }),
        reused: true,
      });
    }

    // 🆕 create new
    // If uid exists, use it as doc id to match your canonical schema.
    // Otherwise fall back to auto-id (kiosk/manual accounts).
    const docRef = uid ? playersCol.doc(uid) : playersCol.doc();
    const userId = docRef.id;

    const name = `${firstName} ${lastName}`.trim();

    const playerDoc = {
      userId,
      orgId,
      name,
      firstName,
      lastName,
      email: email,
      phone: phoneRaw,

      // helpful for reliable lookups
      phoneDigits: phoneNorm.digits,
      phoneNormalized: phoneNorm.last10,

      totalXP: 0,
      rank: "Rookie",
      activeQuestIds: [] as string[],
      completedQuestIds: [] as string[],

      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await docRef.set(playerDoc, { merge: true });

    // Read back the stored doc so timestamps are real Timestamp values (serializable after conversion)
    const savedSnap = await docRef.get();
    const saved = savedSnap.data() as any;

    return NextResponse.json({
      success: true,
      userId,
      player: serializePlayer({ ...saved, userId }),
      reused: false,
    });
  } catch (err: any) {
    console.error("BitGalaxy join error:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Failed to create player" },
      { status: 500 },
    );
  }
}