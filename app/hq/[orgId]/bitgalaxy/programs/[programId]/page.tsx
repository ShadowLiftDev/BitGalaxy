import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { ProgramForm } from "@/components/bitgalaxy/admin/ProgramForm";

type OrgProgramParams = { orgId: string; programId: string };

type BitGalaxyProgramEditPageProps = {
  params: Promise<OrgProgramParams>;
};

export const metadata = {
  title: "BitGalaxy – Edit Program",
};

async function getProgramForEdit(orgId: string, programId: string) {
  const ref = adminDb
    .collection("orgs")
    .doc(orgId)
    .collection("bitgalaxyPrograms")
    .doc(programId);

  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() as any;

  return {
    name: data.name ?? "",
    description: data.description ?? "",
    startAt: data.startAt ?? null,
    endAt: data.endAt ?? null,
    isActive: data.isActive ?? false,
    xpMultiplier: typeof data.xpMultiplier === "number" ? data.xpMultiplier : 1,
    displayOrder: typeof data.displayOrder === "number" ? data.displayOrder : 0,
  };
}

export default async function BitGalaxyProgramEditPage({
  params,
}: BitGalaxyProgramEditPageProps) {
  const { orgId, programId } = await params;
  const decodedOrgId = decodeURIComponent(orgId);
  const decodedProgramId = decodeURIComponent(programId);

  const program = await getProgramForEdit(decodedOrgId, decodedProgramId);
  if (!program) {
    return notFound();
  }

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
            Edit Program
          </div>
          <h2 className="mt-2 text-sm font-semibold text-emerald-50">
            {program.name || "Unnamed Program"}
          </h2>
          <p className="text-xs text-emerald-100/85">
            Adjust dates, multipliers, or activation status. Changes here
            immediately affect how XP is scaled for this world while the program
            is active.
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
        <ProgramForm
          orgId={decodedOrgId}
          mode="edit"
          programId={decodedProgramId}
          initialData={program}
        />
      </section>
    </div>
  );
}