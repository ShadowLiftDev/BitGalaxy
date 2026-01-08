import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { QuestForm } from "@/components/bitgalaxy/admin/QuestForm";

type BitGalaxyQuestEditPageProps = {
  params: { orgId: string; questId: string };
};

export const metadata = {
  title: "BitGalaxy – Edit Quest",
};

async function getQuestForEdit(orgId: string, questId: string) {
  const ref = adminDb
    .collection("orgs")
    .doc(orgId)
    .collection("bitgalaxyQuests")
    .doc(questId);

  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() as any;

  return {
    id: questId,
    title: data.title ?? "",
    description: data.description ?? "",
    programId: data.programId ?? null,
    type: data.type ?? "checkin",
    xp: Number(data.xp ?? 0),
    isActive: data.isActive ?? false,
    maxCompletionsPerUser:
      typeof data.maxCompletionsPerUser === "number"
        ? data.maxCompletionsPerUser
        : null,
    checkinCode: data.checkinCode ?? "",
    requiresStaffApproval: data.requiresStaffApproval ?? false,
    metadata: data.metadata ?? null,
  };
}

export default async function BitGalaxyQuestEditPage({
  params,
}: BitGalaxyQuestEditPageProps) {
  const orgId = decodeURIComponent(params.orgId);
  const questId = decodeURIComponent(params.questId);

  const quest = await getQuestForEdit(orgId, questId);
  if (!quest) {
    return notFound();
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
            {quest.title || "Unnamed Quest"}
          </h2>
          <p className="text-xs text-sky-100/85">
            Tune XP values, quest type, program mapping, and activation state.
            This is the core unit BitGalaxy will emit into history, XP, and
            RewardCircle integrations.
          </p>
        </div>

        <Link
          href={`/hq/neon-lunchbox/bitgalaxy/quests`}
          className="text-[11px] text-sky-200/80 hover:text-sky-100"
        >
          &larr; Back to quests
        </Link>
      </div>

      {/* FORM CONTAINER */}
      <section className="rounded-2xl border border-sky-500/40 bg-slate-950/90 p-4 shadow-[0_0_32px_rgba(56,189,248,0.4)]">
        <QuestForm
          orgId={orgId}
          mode="edit"
          questId={questId}
          initialData={quest}
        />
      </section>
    </div>
  );
}