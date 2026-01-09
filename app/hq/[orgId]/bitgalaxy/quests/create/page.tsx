import Link from "next/link";
import { QuestForm } from "@/components/bitgalaxy/admin/QuestForm";

type BitGalaxyQuestCreatePageProps = {
  params: Promise<{ orgId: string }>;
};

export const metadata = {
  title: "BitGalaxy – Create Quest",
};

export default async function BitGalaxyQuestCreatePage({
  params,
}: BitGalaxyQuestCreatePageProps) {
  const { orgId } = await params;
  const decodedOrgId = decodeURIComponent(orgId);

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/60 bg-sky-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-sky-300">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
            Create Quest
          </div>
          <h2 className="mt-2 text-sm font-semibold text-sky-50">
            New BitGalaxy Quest
          </h2>
          <p className="text-xs text-sky-100/85">
            Define a mission, choose its type (check-in, manual, referral,
            etc.), assign XP, and optionally attach it to a program/season.
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
        <QuestForm orgId={decodedOrgId} mode="create" />
      </section>
    </div>
  );
}