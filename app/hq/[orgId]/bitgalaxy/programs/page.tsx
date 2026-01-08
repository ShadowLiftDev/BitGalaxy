import Link from "next/link";
import { adminDb } from "@/lib/firebase-admin";

type OrgParams = { orgId: string };

type BitGalaxyProgramsListPageProps = {
  params: Promise<OrgParams>;
};

export const metadata = {
  title: "BitGalaxy – Programs",
};

async function getOrgPrograms(orgId: string) {
  const snap = await adminDb
    .collection("orgs")
    .doc(orgId)
    .collection("bitgalaxyPrograms")
    .orderBy("displayOrder", "asc")
    .get();

  const programs: any[] = [];
  snap.forEach((doc) => {
    programs.push({ id: doc.id, ...(doc.data() as any) });
  });
  return programs;
}

export default async function BitGalaxyProgramsListPage({
  params,
}: BitGalaxyProgramsListPageProps) {
  const { orgId } = await params;
  const decodedOrgId = decodeURIComponent(orgId);

  const programs = await getOrgPrograms(decodedOrgId);

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
            BitGalaxy · Programs Node
          </div>
          <h2 className="mt-2 text-sm font-semibold text-emerald-50">
            Programs &amp; Seasons
          </h2>
          <p className="text-xs text-emerald-100/85">
            Define the seasons and arcs that wrap your quests. Each program can
            carry date ranges, XP multipliers, and custom ordering in the
            player UI.
          </p>
        </div>

        <Link
          href={`/hq/neon-lunchbox/bitgalaxy/programs/create`}
          className="inline-flex items-center justify-center rounded-xl border border-emerald-500/70 bg-emerald-500 px-3 py-2 text-[11px] font-semibold text-slate-950 shadow-[0_0_18px_rgba(16,185,129,0.7)] transition hover:bg-emerald-400 hover:border-emerald-300"
        >
          + New program
        </Link>
      </div>

      {/* BODY */}
      {programs.length === 0 ? (
        <div className="rounded-2xl border border-emerald-500/40 bg-slate-950/90 px-4 py-4 text-xs text-emerald-100/85 shadow-[0_0_28px_rgba(15,23,42,0.95)]">
          <p>
            No programs defined yet. Create your first season to group quests
            into a themed arc and apply multipliers for a limited time (e.g.
            &quot;Summer Launch&quot;, &quot;Founders Season&quot;).
          </p>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-slate-950/85 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
          {/* holo wash */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-35 mix-blend-screen [background-image:radial-gradient(circle_at_top,_rgba(16,185,129,0.28)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.25)_0,_transparent_55%)]"
          />

          <div className="relative overflow-x-auto rounded-2xl border border-slate-900/80 bg-slate-950/95">
            <table className="min-w-full text-left text-xs text-emerald-50">
              <thead className="border-b border-slate-800/80 bg-slate-950/95 text-[11px] uppercase tracking-wide text-emerald-300/85">
                <tr>
                  <th className="px-3 py-2">Program</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">XP Mult</th>
                  <th className="px-3 py-2">Dates</th>
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((p, idx) => {
                  const isActive = p.isActive ?? false;
                  const start =
                    p.startAt && p.startAt.toDate
                      ? p.startAt.toDate().toLocaleDateString()
                      : "";
                  const end =
                    p.endAt && p.endAt.toDate
                      ? p.endAt.toDate().toLocaleDateString()
                      : "";
                  return (
                    <tr
                      key={p.id}
                      className={
                        "border-b border-slate-900/80 last:border-b-0 " +
                        (isActive
                          ? "bg-emerald-900/30"
                          : idx % 2 === 0
                          ? "bg-slate-950/70"
                          : "bg-slate-950/40")
                      }
                    >
                      <td className="px-3 py-2 text-[11px]">
                        <div className="flex flex-col">
                          <span className="font-semibold text-emerald-50">
                            {p.name}
                          </span>
                          <span className="mt-0.5 text-[10px] text-emerald-200/80">
                            {p.description || "No description"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[11px]">
                        <span
                          className={
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                            (isActive
                              ? "bg-emerald-500/25 text-emerald-100"
                              : "bg-slate-700/80 text-slate-200")
                          }
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-emerald-200/90">
                        {p.xpMultiplier ?? 1}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-emerald-200/90">
                        {start || "—"} {end && "→ " + end}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-emerald-200/90">
                        {p.displayOrder ?? 0}
                      </td>
                      <td className="px-3 py-2 text-right text-[11px]">
                        <Link
                          href={`/hq/neon-lunchbox/bitgalaxy/programs/${encodeURIComponent(p.id)}`}
                          className="rounded-lg border border-emerald-500/50 px-2 py-1 text-[11px] text-emerald-100 transition hover:bg-emerald-500/15"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[11px] text-emerald-200/80">
        Programs are the **season layer** of BitGalaxy. ProfileMatrix can later
        show how each season impacted engagement, visits, and revenue across the
        rest of the Neon Ecosystem.
      </p>
    </div>
  );
}