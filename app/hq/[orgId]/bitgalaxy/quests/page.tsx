import Link from "next/link";
import { adminDb } from "@/lib/firebase-admin";

type BitGalaxyQuestsListPageProps = {
  params: Promise<{ orgId: string }>;
};

export const metadata = {
  title: "BitGalaxy – Quests",
};

async function getOrgQuests(orgId: string) {
  const snap = await adminDb
    .collection("orgs")
    .doc(orgId)
    .collection("bitgalaxyQuests")
    .orderBy("createdAt", "desc")
    .get();

  const quests: any[] = [];
  snap.forEach((doc) => {
    quests.push({ id: doc.id, ...(doc.data() as any) });
  });
  return quests;
}

export default async function BitGalaxyQuestsListPage({
  params,
}: BitGalaxyQuestsListPageProps) {
  const { orgId } = await params;
  const decodedOrgId = decodeURIComponent(orgId);
  const quests = await getOrgQuests(decodedOrgId);

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/60 bg-sky-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-sky-300">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
            BitGalaxy · Quest Matrix
          </div>
          <h2 className="mt-2 text-sm font-semibold text-sky-50">
            Quests for this World
          </h2>
          <p className="text-xs text-sky-100/85">
            Define the missions that drive XP, visits, and engagement. Each
            quest can be tied to check-ins, purchases, events, or custom flows
            across the Neon Ecosystem.
          </p>
        </div>

        <Link
          href={`/hq/${encodeURIComponent(decodedOrgId)}/bitgalaxy/quests/create`}
          className="inline-flex items-center justify-center rounded-xl border border-sky-500/70 bg-sky-500 px-3 py-2 text-[11px] font-semibold text-slate-950 shadow-[0_0_18px_rgba(56,189,248,0.7)] transition hover:bg-sky-400 hover:border-sky-300"
        >
          + New quest
        </Link>
      </div>

      {/* BODY */}
      {quests.length === 0 ? (
        <div className="rounded-2xl border border-sky-500/40 bg-slate-950/90 px-4 py-4 text-xs text-sky-100/85 shadow-[0_0_28px_rgba(15,23,42,0.95)]">
          <p>
            No quests defined yet. Create your first mission to start awarding
            XP for check-ins, referrals, purchases, or special events. This is
            the core content layer of BitGalaxy.
          </p>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-sky-500/40 bg-slate-950/85 shadow-[0_0_40px_rgba(56,189,248,0.35)]">
          {/* holo wash */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-35 mix-blend-screen [background-image:radial-gradient(circle_at_top,_rgba(56,189,248,0.3)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.25)_0,_transparent_55%)]"
          />

          <div className="relative overflow-x-auto rounded-2xl border border-slate-900/80 bg-slate-950/95">
            <table className="min-w-full text-left text-xs text-sky-50">
              <thead className="border-b border-slate-800/80 bg-slate-950/95 text-[11px] uppercase tracking-wide text-sky-300/85">
                <tr>
                  <th className="px-3 py-2">Quest</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">XP</th>
                  <th className="px-3 py-2">Program</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quests.map((quest, idx) => {
                  const isActive = quest.isActive ?? false;
                  return (
                    <tr
                      key={quest.id}
                      className={
                        "border-b border-slate-900/80 last:border-b-0 " +
                        (isActive
                          ? "bg-sky-900/25"
                          : idx % 2 === 0
                          ? "bg-slate-950/70"
                          : "bg-slate-950/40")
                      }
                    >
                      <td className="px-3 py-2 text-[11px] text-sky-50">
                        <div className="flex flex-col">
                          <span className="font-semibold">{quest.title}</span>
                          <span className="mt-0.5 text-[10px] text-sky-300/80">
                            {quest.description || "No description"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-sky-200/90">
                        {quest.type}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-sky-200/90">
                        {quest.xp}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-sky-200/90">
                        {quest.programId || "—"}
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
                      <td className="px-3 py-2 text-right text-[11px]">
                        <Link
                          href={`/hq/${encodeURIComponent(
                            decodedOrgId,
                          )}/bitgalaxy/quests/${encodeURIComponent(quest.id)}`}
                          className="rounded-lg border border-sky-500/50 px-2 py-1 text-[11px] text-sky-100 transition hover:bg-sky-500/15"
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

      <p className="text-[11px] text-sky-200/80">
        Quests are the <strong>atomic missions</strong>. Programs group them
        into seasons; ProfileMatrix will eventually show which quests drive the
        best cross-app behavior (visits, spending, referrals) across the Neon
        Ecosystem.
      </p>
    </div>
  );
}