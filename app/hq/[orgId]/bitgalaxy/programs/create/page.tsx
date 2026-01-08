import Link from "next/link";
import { ProgramForm } from "@/components/bitgalaxy/admin/ProgramForm";

type OrgParams = { orgId: string };

type BitGalaxyProgramCreatePageProps = {
  params: Promise<OrgParams>;
};

export const metadata = {
  title: "BitGalaxy – Create Program",
};

export default async function BitGalaxyProgramCreatePage({
  params,
}: BitGalaxyProgramCreatePageProps) {
  const { orgId } = await params;
  const decodedOrgId = decodeURIComponent(orgId);

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
            Create Program
          </div>
          <h2 className="mt-2 text-sm font-semibold text-emerald-50">
            New BitGalaxy Program / Season
          </h2>
          <p className="text-xs text-emerald-100/85">
            Name the arc, set dates, and choose an XP multiplier. Players will
            see this program as the narrative wrapper around their quests.
          </p>
        </div>

        <Link
          href={`/hq/neon-lunchbox/bitgalaxy/programs`}
          className="text-[11px] text-emerald-200/80 hover:text-emerald-100"
        >
          &larr; Back to programs
        </Link>
      </div>

      {/* FORM CONTAINER */}
      <section className="rounded-2xl border border-emerald-500/40 bg-slate-950/90 p-4 shadow-[0_0_32px_rgba(16,185,129,0.4)]">
        <ProgramForm orgId={decodedOrgId} mode="create" />
      </section>
    </div>
  );
}