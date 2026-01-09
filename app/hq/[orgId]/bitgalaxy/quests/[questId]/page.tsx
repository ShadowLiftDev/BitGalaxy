import Link from "next/link";
import { adminDb } from "@/lib/firebase-admin";
import { QuestForm } from "@/components/bitgalaxy/admin/QuestForm";

type BitGalaxyQuestEditPageProps = {
  params: Promise<{ orgId: string; questId: string }>;
};

export const metadata = {
  title: "BitGalaxy – Edit Quest",
};

async function getQuest(orgId: string, questId: string) {
  const snap = await adminDb
    .collection("orgs")
    .doc(orgId)
    .collection("bitgalaxyQuests")
    .doc(questId)
    .get();

  if (!snap.exists) return null;

  const data = snap.data() as any;

  return {
    title: data.title ?? "",
    description: data.description ?? "",
    programId: data.programId ?? "",
    type: data.type ?? "checkin",
    xp: typeof data.xp === "number" ? data.xp : 10,
    isActive: data.isActive ?? true,
    maxCompletionsPerUser:
      typeof data.maxCompletionsPerUser === "number"
        ? data.maxCompletionsPerUser
        : null,
    checkinCode: data.checkinCode ?? "",
    requiresStaffApproval: data.requiresStaffApproval ?? false,
    metadata: data.metadata ?? {},

    loyaltyReward: data.loyaltyReward ?? {
      enabled: false,
      pointsPerCompletion: 0,
    },
  };
}

export default async function BitGalaxyQuestEditPage({
  params,
}: BitGalaxyQuestEditPageProps) {
  const { orgId, questId } = await params;
  const decodedOrgId = decodeURIComponent(orgId);
  const decodedQuestId = decodeURIComponent(questId);

  const initialData = await getQuest(decodedOrgId, decodedQuestId);

  if (!initialData) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-red-300">
          This quest could not be found. It may have been deleted.
        </p>
        <Link
          href={`/hq/${encodeURIComponent(decodedOrgId)}/bitgalaxy/quests`}
          className="text-[11px] text-sky-200/80 hover:text-sky-100"
        >
          &larr; Back to quests
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/60 bg-sky-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-sky-300">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
            Edit Quest
          </div>
          <h2 className="mt-2 text-sm font-semibold text-sky-50">
            {initialData.title || "Edit Quest"}
          </h2>
          <p className="text-xs text-sky-100/85">
            Adjust XP, loyalty points, and other settings for this mission.
          </p>
        </div>

        <Link
          href={`/hq/${encodeURIComponent(decodedOrgId)}/bitgalaxy/quests`}
          className="text-[11px] text-sky-200/80 hover:text-sky-100"
        >
          &larr; Back to quests
        </Link>
      </div>

      {/* FORM CONTAINER */}
      <section className="rounded-2xl border border-sky-500/40 bg-slate-950/90 p-4 shadow-[0_0_32px_rgba(56,189,248,0.4)]">
        <QuestForm
          orgId={decodedOrgId}
          mode="edit"
          questId={decodedQuestId}
          initialData={initialData}
        />
      </section>
    </div>
  );
}