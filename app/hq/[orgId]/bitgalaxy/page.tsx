import { adminDb } from "@/lib/firebase-admin";

type OrgParams = { orgId: string };

type BitGalaxyDashboardPageProps = {
  params: Promise<OrgParams>;
};

export const metadata = {
  title: "BitGalaxy – Org Dashboard",
};

async function getBitGalaxyConfig(orgId: string) {
  const cfgRef = adminDb
    .collection("orgs")
    .doc(orgId)
    .collection("bitgalaxyConfig")
    .doc("config");

  const snap = await cfgRef.get();
  if (!snap.exists) return null;
  return snap.data() as any;
}

async function getBitGalaxyStats(orgId: string) {
  const playersSnap = await adminDb
    .collection("orgs")
    .doc(orgId)
    .collection("bitgalaxyPlayers")
    .get();

  const totalPlayers = playersSnap.size;
  let totalXP = 0;
  let activePlayers = 0;

  playersSnap.forEach((doc) => {
    const data = doc.data() as any;
    const xp = Number(data.totalXP ?? 0);
    totalXP += xp;
    if (xp > 0) activePlayers += 1;
  });

  const avgXP = totalPlayers > 0 ? Math.round(totalXP / totalPlayers) : 0;

  const questsSnap = await adminDb
    .collection("orgs")
    .doc(orgId)
    .collection("bitgalaxyQuests")
    .where("isActive", "==", true)
    .get();

  const activeQuests = questsSnap.size;

  return {
    totalPlayers,
    activePlayers,
    activeQuests,
    totalXP,
    avgXP,
  };
}

export default async function BitGalaxyDashboardPage({
  params,
}: BitGalaxyDashboardPageProps) {
  // ✅ unwrap params Promise
  const { orgId } = await params;
  const decodedOrgId = decodeURIComponent(orgId);

  const [config, stats] = await Promise.all([
    getBitGalaxyConfig(decodedOrgId),
    getBitGalaxyStats(decodedOrgId),
  ]);

  const enabled = config?.enabled ?? false;
  const theme = config?.theme ?? "neon";
  const xpPerCheckin = config?.xpPerCheckin ?? 0;
  const defaultProgramId = config?.defaultProgramId ?? null;

  return (
    <div className="space-y-5">
      {/* STATUS + CONFIG OVERVIEW */}
      <section className="rounded-2xl border border-sky-500/40 bg-slate-950/85 p-5 shadow-[0_0_38px_rgba(56,189,248,0.4)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-sky-50">
              World Status
            </h2>
            <p className="mt-1 text-xs text-sky-100/85">
              High-level overview of BitGalaxy configuration and health for this
              organization.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-sky-100">
            <div className="flex flex-col items-start rounded-xl border border-sky-500/50 bg-slate-950/90 px-3 py-2">
              <span className="text-[11px] text-sky-300/80">
                BitGalaxy
              </span>
              <span
                className={
                  "mt-1 rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                  (enabled
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "bg-slate-700/80 text-slate-200")
                }
              >
                {enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex flex-col items-start rounded-xl border border-sky-500/50 bg-slate-950/90 px-3 py-2">
              <span className="text-[11px] text-sky-300/80">
                Theme
              </span>
              <span className="mt-1 text-[11px] font-semibold text-sky-100">
                {theme}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 text-xs text-sky-100 sm:grid-cols-3">
          <div className="rounded-lg border border-sky-500/30 bg-slate-950/95 p-3">
            <div className="text-[11px] text-sky-300/80">
              XP per check-in (fallback)
            </div>
            <div className="mt-1 text-lg font-semibold text-sky-50">
              {xpPerCheckin}
            </div>
            <p className="mt-1 text-[11px] text-sky-300/80">
              Used when a player checks in but no specific check-in quest is
              matched.
            </p>
          </div>

          <div className="rounded-lg border border-sky-500/30 bg-slate-950/95 p-3">
            <div className="text-[11px] text-sky-300/80">
              Default program
            </div>
            <div className="mt-1 text-sm font-semibold text-sky-50">
              {defaultProgramId ?? "None set"}
            </div>
            <p className="mt-1 text-[11px] text-sky-300/80">
              New players and check-ins can be associated with this seasonal
              program.
            </p>
          </div>

          <div className="rounded-lg border border-sky-500/30 bg-slate-950/95 p-3">
            <div className="text-[11px] text-sky-300/80">
              Config source
            </div>
            <div className="mt-1 text-[11px] font-mono text-sky-50">
              orgs/neon-lunchbox/bitgalaxyConfig/config
            </div>
            <p className="mt-1 text-[11px] text-sky-300/80">
              Manage details in the BitGalaxy Settings tab.
            </p>
          </div>
        </div>
      </section>

      {/* CORE KPIs */}
      <section className="rounded-2xl border border-sky-500/40 bg-slate-950/85 p-5 shadow-[0_0_32px_rgba(15,23,42,0.9)]">
        <h2 className="text-sm font-semibold text-sky-50">
          Player & Quest Metrics
        </h2>
        <p className="mt-1 text-xs text-sky-100/85">
          Live stats computed from player and quest collections in Firestore.
        </p>

        <div className="mt-4 grid gap-3 text-xs text-sky-100 sm:grid-cols-4">
          <div className="rounded-lg border border-sky-500/30 bg-slate-950/95 p-3">
            <div className="text-[11px] text-sky-300/80">Total players</div>
            <div className="mt-1 text-lg font-semibold text-sky-50">
              {stats.totalPlayers}
            </div>
          </div>

          <div className="rounded-lg border border-sky-500/30 bg-slate-950/95 p-3">
            <div className="text-[11px] text-sky-300/80">Active players</div>
            <div className="mt-1 text-lg font-semibold text-sky-50">
              {stats.activePlayers}
            </div>
            <p className="mt-1 text-[11px] text-sky-300/80">
              Players with &gt; 0 XP.
            </p>
          </div>

          <div className="rounded-lg border border-sky-500/30 bg-slate-950/95 p-3">
            <div className="text-[11px] text-sky-300/80">Active quests</div>
            <div className="mt-1 text-lg font-semibold text-sky-50">
              {stats.activeQuests}
            </div>
            <p className="mt-1 text-[11px] text-sky-300/80">
              Quests where{" "}
              <span className="font-mono">isActive == true</span>.
            </p>
          </div>

          <div className="rounded-lg border border-sky-500/30 bg-slate-950/95 p-3">
            <div className="text-[11px] text-sky-300/80">
              Avg XP per player
            </div>
            <div className="mt-1 text-lg font-semibold text-sky-50">
              {stats.avgXP}
            </div>
            <p className="mt-1 text-[11px] text-sky-300/80">
              Computed from <span className="font-mono">totalXP</span> across
              all players.
            </p>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-sky-300/80">
          Deeper analytics (retention, visit frequency, and per-program
          performance) live in the <strong>Analytics</strong> tab powered by the{" "}
          <span className="font-mono">analyticsEngine</span> helpers.
        </p>
      </section>
    </div>
  );
}