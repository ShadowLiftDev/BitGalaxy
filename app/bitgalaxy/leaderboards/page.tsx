import Link from "next/link";
import { GalaxyHeader } from "@/components/bitgalaxy/GalaxyHeader";
import {
  getOrgLeaderboard,
  type LeaderboardScope,
} from "@/lib/bitgalaxy/leaderboard";
import { getServerUser } from "@/lib/auth-server";

const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? "neon-lunchbox";

export const metadata = {
  title: "BitGalaxy – Leaderboards",
};

type BitGalaxyLeaderboardsPageProps = {
  // Match the Promise-based pattern + allow optional userId
  searchParams?: Promise<{ scope?: string; userId?: string }>;
};

export default async function BitGalaxyLeaderboardsPage({
  searchParams,
}: BitGalaxyLeaderboardsPageProps) {
  const orgId = DEFAULT_ORG_ID;

  const resolvedSearch = (searchParams
    ? await searchParams
    : {}) as { scope?: string; userId?: string };

  const scope: LeaderboardScope =
    resolvedSearch.scope === "weekly" ? "weekly" : "allTime";

  // Prefer userId from URL, fall back to authed user for highlight only
  let userId: string | null = resolvedSearch.userId ?? null;

  if (!userId) {
    const user = await getServerUser();
    if (user) {
      userId = user.uid;
    }
  }

  const leaderboard = await getOrgLeaderboard(orgId, 50, scope);
  const yourIndex =
    userId != null
      ? leaderboard.findIndex((e) => e.userId === userId)
      : -1;

  const isWeekly = scope === "weekly";
  const xpLabel = isWeekly ? "Weekly XP" : "Total XP";

  return (
    <div className="space-y-6">
      <GalaxyHeader orgName={orgId} />

      <section className="relative overflow-hidden rounded-2xl border border-violet-500/40 bg-slate-950/85 p-5 shadow-[0_0_40px_rgba(139,92,246,0.45)]">
        {/* nebula */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen [background-image:radial-gradient(circle_at_top,_rgba(129,140,248,0.32)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.25)_0,_transparent_55%),linear-gradient(120deg,rgba(15,23,42,0.98)_0,rgba(15,23,42,0.92)_40%,rgba(15,23,42,0.92)_60%,rgba(15,23,42,0.98)_100%)]"
        />

        <div className="relative space-y-4">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/50 bg-violet-500/15 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-violet-200">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_10px_rgba(167,139,250,0.9)]" />
                {isWeekly ? "Weekly Ladder" : "Global Ladder"}
              </div>

              <h2 className="mt-2 text-lg font-semibold text-violet-50">
                World Leaderboards
              </h2>

              <p className="text-xs text-violet-100/80">
                {isWeekly
                  ? "Top operatives this week, ranked by weekly XP."
                  : "Top operatives in this BitGalaxy world, ranked by total XP."}
              </p>

              {/* Toggle */}
              <div className="mt-3 inline-flex overflow-hidden rounded-full border border-violet-500/40 bg-slate-950/70 text-[11px]">
                <Link
                  href="/bitgalaxy/leaderboards?scope=allTime"
                  className={`px-3 py-1.5 ${
                    !isWeekly
                      ? "bg-violet-500/20 text-violet-100"
                      : "text-violet-200/80 hover:bg-white/5"
                  }`}
                >
                  All-Time
                </Link>
                <Link
                  href="/bitgalaxy/leaderboards?scope=weekly"
                  className={`px-3 py-1.5 ${
                    isWeekly
                      ? "bg-violet-500/20 text-violet-100"
                      : "text-violet-200/80 hover:bg-white/5"
                  }`}
                >
                  Weekly
                </Link>
              </div>
            </div>

            <div className="text-right text-[11px] text-violet-200/85">
              <p>
                {leaderboard.length} player
                {leaderboard.length === 1 ? "" : "s"} on board
              </p>
              <p className="mt-0.5 text-[10px] text-violet-200/65">
                Future update: multi-world and seasonal ladders.
              </p>
            </div>
          </header>

          {leaderboard.length === 0 ? (
            <div className="mt-2 rounded-xl border border-violet-500/40 bg-slate-950/95 px-4 py-4 text-xs text-violet-100/85">
              <p className="font-medium text-violet-100">
                No signals on the ladder yet.
              </p>
              <p className="mt-1 text-violet-200/85">
                {isWeekly
                  ? "No one has earned XP yet this week."
                  : "As soon as players start earning XP through quests and check-ins, the ranking grid will light up."}
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-900/90 bg-slate-950/90">
              <table className="min-w-full text-left text-xs text-violet-50">
                <thead className="border-b border-slate-800/90 bg-slate-950/95 text-[11px] uppercase tracking-[0.16em] text-violet-300/85">
                  <tr>
                    <th className="px-3 py-2">Pos</th>
                    <th className="px-3 py-2">Player ID</th>
                    <th className="px-3 py-2">Rank</th>
                    <th className="px-3 py-2 text-right">{xpLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => {
                    const isYou =
                      userId != null && entry.userId === userId;
                    const pos = index + 1;

                    const rowHighlight =
                      pos === 1
                        ? "bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent"
                        : pos === 2
                        ? "bg-gradient-to-r from-slate-200/10 via-slate-100/5 to-transparent"
                        : pos === 3
                        ? "bg-gradient-to-r from-amber-700/10 via-amber-600/5 to-transparent"
                        : "";

                    const xpValue = isWeekly
                      ? Number(entry.weeklyXP || 0)
                      : Number(entry.totalXP || 0);

                    return (
                      <tr
                        key={entry.userId}
                        className={`border-b border-slate-900/80 last:border-b-0 ${rowHighlight} ${
                          isYou
                            ? "bg-emerald-900/20"
                            : index % 2 === 0
                            ? "bg-slate-950/70"
                            : "bg-slate-950/50"
                        }`}
                      >
                        <td className="px-3 py-2 text-[11px] text-violet-200/90">
                          #{pos}
                        </td>
                        <td className="px-3 py-2 text-[11px] font-mono text-violet-100/95">
                          {entry.userId}
                          {isYou && (
                            <span className="ml-2 rounded-full bg-emerald-500/25 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                              You
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[11px] text-violet-200/90">
                          {entry.rank}
                        </td>
                        <td className="px-3 py-2 text-right text-[11px] font-semibold text-violet-50">
                          {xpValue.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {yourIndex >= 0 && (
            <p className="mt-3 text-[11px] text-emerald-300/85">
              You&apos;re currently holding{" "}
              <span className="font-semibold">#{yourIndex + 1}</span>{" "}
              {isWeekly ? "this week" : "overall"} on this world&apos;s ladder.
            </p>
          )}

          <footer className="mt-3 text-[11px] text-violet-200/80">
            Leaderboards are scoped per world. In a future NeonMatrix
            integration, public-facing ladders will showcase the most active
            BitGalaxy hubs across the city.
          </footer>
        </div>
      </section>
    </div>
  );
}