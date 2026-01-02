import { GalaxyHeader } from "@/components/bitgalaxy/GalaxyHeader";
import { ActiveQuestCard } from "@/components/bitgalaxy/ActiveQuestCard";
import { getActiveQuests } from "@/lib/bitgalaxy/getActiveQuests";
import { getPlayer } from "@/lib/bitgalaxy/getPlayer";
import { getServerUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";

const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? "neon-lunchbox";

export const metadata = {
  title: "BitGalaxy – Active Quests",
};

export default async function BitGalaxyActivePage() {
  const orgId = DEFAULT_ORG_ID;

  // Get the authenticated user (player)
  const user = await getServerUser();
  if (!user) {
    redirect("/login?from=/bitgalaxy/active");
  }

  const userId = user.uid;

  const [player, activeQuests] = await Promise.all([
    getPlayer(orgId, userId),
    getActiveQuests(orgId, userId),
  ]);

  return (
    <div className="space-y-6">
      <GalaxyHeader orgName={orgId} />

      <section className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-slate-950/80 p-5 shadow-[0_0_40px_rgba(16,185,129,0.35)]">
        {/* holographic overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen [background-image:radial-gradient(circle_at_top,_rgba(52,211,153,0.25)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.22)_0,_transparent_55%),linear-gradient(90deg,rgba(15,23,42,0.95)_0,rgba(15,23,42,0.9)_40%,rgba(15,23,42,0.9)_60%,rgba(15,23,42,0.95)_100%)]"
        />

        <div className="relative space-y-4">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                Active Quest Log
              </div>
              <h2 className="mt-2 text-lg font-semibold text-emerald-50">
                Current Contracts
              </h2>
              <p className="text-xs text-emerald-100/70">
                Track the missions you&apos;ve locked in across the Neon
                sectors.
              </p>
            </div>

            <div className="text-right text-[11px] text-emerald-200/80">
              <p>
                Rank:{" "}
                <span className="font-semibold text-emerald-300">
                  {player.rank}
                </span>
              </p>
              <p className="mt-0.5">
                Total XP:{" "}
                <span className="font-semibold text-emerald-300">
                  {player.totalXP}
                </span>
              </p>
              <p className="mt-0.5 text-[10px] text-emerald-200/60">
                {activeQuests.length} active contract
                {activeQuests.length === 1 ? "" : "s"}
              </p>
            </div>
          </header>

          {activeQuests.length === 0 ? (
            <div className="mt-2 rounded-xl border border-emerald-500/30 bg-slate-950/80 px-4 py-4 text-xs text-emerald-100/80">
              <p className="font-medium text-emerald-200">
                No contracts on the board… yet.
              </p>
              <p className="mt-1 text-emerald-100/70">
                Jack into the{" "}
                <span className="font-semibold text-emerald-300">
                  Quest Directory
                </span>{" "}
                to pick a mission and start farming XP. Your galaxy doesn&apos;t
                level itself.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeQuests.map((quest) => (
                <ActiveQuestCard key={quest.id} quest={quest} orgId={orgId} />
              ))}
            </div>
          )}

          <footer className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-200/70">
            <span>
              Progress updates in real time as you complete check-ins and
              milestones.
            </span>
            <span className="text-emerald-300/80">
              Tip: Stack shorter quests to spike XP bursts.
            </span>
          </footer>
        </div>
      </section>
    </div>
  );
}