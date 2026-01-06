import { adminDb } from "@/lib/firebase-admin";
import { getLevelForXP, getRankForXP } from "./rankEngine";
import { FieldValue } from "firebase-admin/firestore";
import { getISOWeekKey } from "@/lib/weekKey";

export interface PlayerInventoryItem {
  itemId: string;
  quantity: number;
  label?: string;
  description?: string;
  source?: string;
  createdAt?: FirebaseFirestore.Timestamp | null;
}

export interface BitGalaxyPlayer {
  userId: string;
  orgId: string;

  totalXP: number;
  rank: string;

  level: number;
  weeklyXP: number;
  weeklyWeekKey: string;

  currentProgramId: string | null;
  activeQuestIds: string[];
  completedQuestIds: string[];
  inventory: PlayerInventoryItem[];

  lastCheckinAt: FirebaseFirestore.Timestamp | null;
  createdAt: FirebaseFirestore.Timestamp | null;
  updatedAt: FirebaseFirestore.Timestamp | null;
}

const PLAYERS_SUBCOLLECTION = "bitgalaxyPlayers";

function normalizePlayer(orgId: string, userId: string, data: any): BitGalaxyPlayer {
  const totalXP = Number(data?.totalXP || 0);

  const rank = data?.rank ?? getRankForXP(totalXP);
  const level = Number.isFinite(data?.level) ? Number(data.level) : getLevelForXP(totalXP);

  const currentWeekKey = getISOWeekKey(new Date());

  return {
    ...data,
    userId: data?.userId ?? userId,
    orgId,

    totalXP,
    rank,
    level,

    weeklyXP: Number(data?.weeklyXP || 0),
    weeklyWeekKey: String(data?.weeklyWeekKey || currentWeekKey),

    currentProgramId: (data?.currentProgramId ?? null) as string | null,
    activeQuestIds: Array.isArray(data?.activeQuestIds) ? data.activeQuestIds : [],
    completedQuestIds: Array.isArray(data?.completedQuestIds) ? data.completedQuestIds : [],
    inventory: Array.isArray(data?.inventory) ? data.inventory : [],

    lastCheckinAt: (data?.lastCheckinAt ?? null) as FirebaseFirestore.Timestamp | null,
    createdAt: (data?.createdAt ?? null) as FirebaseFirestore.Timestamp | null,
    updatedAt: (data?.updatedAt ?? null) as FirebaseFirestore.Timestamp | null,
  };
}

export async function getPlayer(orgId: string, userId: string): Promise<BitGalaxyPlayer> {
  if (!orgId) throw new Error("getPlayer: orgId is required");
  if (!userId) throw new Error("getPlayer: userId is required");

  const playerRef = adminDb
    .collection("orgs")
    .doc(orgId)
    .collection(PLAYERS_SUBCOLLECTION)
    .doc(userId);

  const snap = await playerRef.get();

  if (snap.exists) {
    return normalizePlayer(orgId, userId, snap.data());
  }

  // Create default player if missing (race-safe)
  await adminDb.runTransaction(async (tx) => {
    const freshSnap = await tx.get(playerRef);
    if (freshSnap.exists) return;

    const now = FieldValue.serverTimestamp();
    const totalXP = 0;

    const newPlayerBase = {
      userId,
      orgId,
      totalXP,
      rank: getRankForXP(totalXP),
      level: getLevelForXP(totalXP),
      weeklyXP: 0,
      weeklyWeekKey: getISOWeekKey(new Date()),
      currentProgramId: null,
      activeQuestIds: [],
      completedQuestIds: [],
      inventory: [],
      lastCheckinAt: null,
    };

    tx.set(
      playerRef,
      { ...newPlayerBase, createdAt: now, updatedAt: now },
      { merge: true },
    );
  });

  // ✅ Read back so createdAt/updatedAt are real Timestamps
  const createdSnap = await playerRef.get();
  return normalizePlayer(orgId, userId, createdSnap.data() ?? {});
}