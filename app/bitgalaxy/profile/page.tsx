import { GalaxyHeader } from "@/components/bitgalaxy/GalaxyHeader";
import { XPProgressBar } from "@/components/bitgalaxy/XPProgressBar";
import { getPlayer } from "@/lib/bitgalaxy/getPlayer";
import { getRankProgress } from "@/lib/bitgalaxy/rankEngine";
import { getServerUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";

const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? "neon-lunchbox";

export const metadata = {
  title: "BitGalaxy – Profile",
};

export default async function BitGalaxyProfilePage() {
  const orgId = DEFAULT_ORG_ID;

  // Require an authenticated player
  const user = await getServerUser();
  if (!user) {
    redirect("/login?from=/bitgalaxy/profile");
  }

  const userId = user.uid;
  const player = await getPlayer(orgId, userId);
  const progress = getRankProgress(player.totalXP);

  const totalCompleted = player.completedQuestIds?.length ?? 0;
  const activeCount = player.activeQuestIds?.length ?? 0;

  return (
    <div className="space-y-6">
      <GalaxyHeader orgName={orgId} />

      <section className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-slate-950/85 p-5 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
        {/* holo wash */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen [background-image:radial-gradient(circle_at_top,_rgba(16,185,129,0.3)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.25)_0,_transparent_55%),linear-gradient(135deg,rgba(15,23,42,0.98)_0,rgba(15,23,42,0.9)_40%,rgba(15,23,42,0.9)_60%,rgba(15,23,42,0.98)_100%)]"
        />

        <div className="relative space-y-5">
          {/* HEADER */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
                Pilot Profile
              </div>
              <h2 className="mt-2 text-lg font-semibold text-emerald-50">
                Your BitGalaxy Signature
              </h2>
              <p className="text-xs text-emerald-100/80">
                XP, rank, and quest footprint for this world. As you play, this
                console becomes your permanent record.
              </p>
            </div>

            <div className="flex gap-4 rounded-xl border border-emerald-500/40 bg-slate-950/80 px-4 py-3 text-xs text-emerald-100 shadow-[0_0_24px_rgba(15,23,42,0.95)]">
              <div className="flex flex-col">
                <span className="text-[11px] text-emerald-300/90">Rank</span>
                <span className="mt-0.5 text-base font-semibold text-emerald-50">
                  {player.rank}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-emerald-300/90">
                  Total XP
                </span>
                <span className="mt-0.5 text-base font-semibold text-emerald-50">
                  {player.totalXP}
                </span>
              </div>
            </div>
          </div>

          {/* XP PROGRESS */}
          <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/90 p-4">
            <div className="flex items-center justify-between text-[11px] text-emerald-200/85">
              <span className="font-semibold text-emerald-200">
                Rank trajectory
              </span>
              <span>
                {progress.currentXP} / {progress.tierMaxXP} XP to{" "}
                <span className="font-semibold text-emerald-100">
                  next rank
                </span>
              </span>
            </div>
            <div className="mt-3">
              <XPProgressBar
                rank={progress.rank}
                currentXP={progress.currentXP}
                tierMinXP={progress.tierMinXP}
                tierMaxXP={progress.tierMaxXP}
                progressPercent={progress.progressPercent}
              />
            </div>
          </div>

          {/* QUICK STATS */}
          <div className="grid gap-3 text-xs text-emerald-100/85 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-500/30 bg-slate-950/90 p-3 shadow-[0_0_18px_rgba(15,23,42,0.95)]">
              <div className="text-[11px] text-emerald-300/90">
                Active contracts
              </div>
              <div className="mt-1 text-xl font-semibold text-emerald-50">
                {activeCount}
              </div>
              <p className="mt-1 text-[11px] text-emerald-200/75">
                Missions currently live in your queue.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-slate-950/90 p-3 shadow-[0_0_18px_rgba(15,23,42,0.95)]">
              <div className="text-[11px] text-emerald-300/90">
                Completed quests
              </div>
              <div className="mt-1 text-xl font-semibold text-emerald-50">
                {totalCompleted}
              </div>
              <p className="mt-1 text-[11px] text-emerald-200/75">
                Historical wins recorded in this world.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-slate-950/90 p-3 shadow-[0_0_18px_rgba(15,23,42,0.95)]">
              <div className="text-[11px] text-emerald-300/90">
                Current program
              </div>
              <div className="mt-1 text-sm font-semibold text-emerald-50">
                {player.currentProgramId ?? "None"}
              </div>
              <p className="mt-1 text-[11px] text-emerald-200/75">
                Which progression track your XP is currently tuned to.
              </p>
            </div>
          </div>

          <p className="mt-2 text-[11px] text-emerald-200/80">
            Future upgrades will surface streaks, multi-world footprints,
            seasonal ranks, and Referralink / RewardCircle synergy all from this
            single console.
          </p>
        </div>
      </section>
    </div>
  );
}