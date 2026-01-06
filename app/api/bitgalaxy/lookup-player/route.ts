import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Body = {
  orgId: string;
  email?: string;
  phone?: string;
};

function normalizeEmail(email?: string) {
  const e = (email ?? "").trim().toLowerCase();
  return e || null;
}

function normalizePhone(phone?: string) {
  const digits = (phone ?? "").replace(/[^\d]/g, "");
  if (!digits) return null;
  // last 10 digits covers (727) XXX-XXXX inputs reliably
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<Body>;
    const orgId = body.orgId?.trim();
    const email = normalizeEmail(body.email);
    const phoneDigits = normalizePhone(body.phone);
    const phoneRaw = (body.phone ?? "").trim();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Missing orgId" },
        { status: 400 },
      );
    }

    if (!email && !phoneRaw) {
      return NextResponse.json(
        {
          success: false,
          error: "Provide either an email or a phone number to look up a player.",
        },
        { status: 400 },
      );
    }

    const playersRef = adminDb
      .collection("orgs")
      .doc(orgId)
      .collection("bitgalaxyPlayers");

    // 1) Email lookup (your stored doc uses lowercase email already)
    if (email) {
      const snap = await playersRef.where("email", "==", email).limit(1).get();
      if (!snap.empty) {
        return NextResponse.json({ success: true, userId: snap.docs[0].id });
      }
    }

    // 2) Phone lookup (try common schemas)
    if (phoneRaw) {
      const candidates: Array<{ field: string; value: string | null }> = [
        { field: "phone", value: phoneDigits },
        { field: "phone", value: phoneRaw },
        { field: "phoneNormalized", value: phoneDigits },
        { field: "phoneDigits", value: phoneDigits },
      ];

      for (const c of candidates) {
        if (!c.value) continue;
        const snap = await playersRef.where(c.field, "==", c.value).limit(1).get();
        if (!snap.empty) {
          return NextResponse.json({ success: true, userId: snap.docs[0].id });
        }
      }
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "No BitGalaxy player found with that email/phone in this world. Ask staff to confirm which contact info is on file.",
      },
      { status: 404 },
    );
  } catch (err: any) {
    console.error("BitGalaxy lookup-player error:", err);
    return NextResponse.json(
      { success: false, error: "Unexpected error looking up player." },
      { status: 500 },
    );
  }
}