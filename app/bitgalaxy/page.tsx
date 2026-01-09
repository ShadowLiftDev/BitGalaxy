import Link from "next/link";
import { GalaxyHeader } from "@/components/bitgalaxy/GalaxyHeader";
import { XPProgressBar } from "@/components/bitgalaxy/XPProgressBar";
import { QuestCard } from "@/components/bitgalaxy/QuestCard";

import { getPlayer } from "@/lib/bitgalaxy/getPlayer";
import { getQuests } from "@/lib/bitgalaxy/getQuests";
import { getRankProgress } from "@/lib/bitgalaxy/rankEngine";
import { PlayerLookupGate } from "@/components/bitgalaxy/PlayerLookupGate";

const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? "neon-lunchbox";

type BitGalaxyHomePageProps = {
  // Matches how you're already using searchParams with Promise<>
  searchParams?: Promise<{ userId?: string; orgId?: string }>;
};

export const metadata = {
  title: "BitGalaxy – Player Dashboard",
};

export default async function BitGalaxyHomePage({
  searchParams,
}: BitGalaxyHomePageProps) {
  const resolved = (searchParams ? await searchParams : {}) as {
    orgId?: string;
    userId?: string;
  };

  const orgId = (resolved.orgId ?? DEFAULT_ORG_ID).trim();
  const userId = resolved.userId ?? null;

  // Always carry orgId; optionally carry userId
  const userQuery = `?${new URLSearchParams(
    userId ? { orgId, userId } : { orgId },
  ).toString()}`;

  // 1) NO USER YET → show PlayerLookupGate
  // This matches your PlayerLookupGate contract:
  // - orgId required
  // - redirectBase defaults to "/bitgalaxy" (same page)
  if (!userId) {
    return (
      <div className="space-y-6">
        <GalaxyHeader orgName={orgId} />

        <section className="mt-2">
          <PlayerLookupGate
            orgId={orgId}
            redirectBase="/bitgalaxy"
            joinRedirectUrl={`https://neon-hq.vercel.app/orgs/${encodeURIComponent(
              orgId,
            )}/landing`}
            joinCtaLabel="Create my BitGalaxy profile"
          />
        </section>

        <p className="mt-6 text-center text-[11px] text-slate-500">
          Are you the owner of this world?{" "}
          <a
            href={`/hq/${encodeURIComponent(orgId)}/bitgalaxy`}
            className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
          >
            Open the BitGalaxy console in NeonHQ
          </a>
          .
        </p>
      </div>
    );
  }

  // 2) WE HAVE A USER → load player + quests
  const [player, quests] = await Promise.all([
    getPlayer(orgId, userId),
    getQuests(orgId, { activeOnly: true }),
  ]);

  if (!player) {
    // If lookup succeeded technically but player doc is missing, fall back to gate again
    return (
      <div className="space-y-6">
        <GalaxyHeader orgName={orgId} />
        <section className="mt-2">
          <PlayerLookupGate
            orgId={orgId}
            redirectBase="/bitgalaxy"
            joinRedirectUrl={`https://neon-hq.vercel.app/orgs/${encodeURIComponent(
              orgId,
            )}/landing`}
            joinCtaLabel="Create my BitGalaxy profile"
          />
        </section>
        <p className="text-center text-[11px] text-rose-300">
          We couldn’t load that player ID. Please look up your profile again.
        </p>
      </div>
    );
  }

  const totalXP =
    typeof (player as any)?.totalXP === "number"
      ? (player as any).totalXP
      : 0;

  const progress = getRankProgress(totalXP);
  const activeCount = player.activeQuestIds?.length ?? 0;
  const completedCount = player.completedQuestIds?.length ?? 0;

  const playerLabel =
    (player as any)?.displayName || (player as any)?.name || userId;

  const specialEvents =
    ((player as any)?.specialEvents || {}) as {
      signalLockCompleted?: boolean;
      [key: string]: any;
    };

  const hasSignalLock = !!specialEvents.signalLockCompleted;

  const xpToNextRank =
    Number.isFinite(progress.tierMaxXP) && progress.tierMaxXP > 0
      ? Math.max(progress.tierMaxXP - progress.currentXP, 0)
      : 0;

  const questsForDisplay = hasSignalLock
    ? quests.filter((q) => q.id !== "signal-lock")
    : quests;

  // 🚫 Filter out arcade quests on this page
  const nonArcadeQuestsForDisplay = questsForDisplay.filter(
    (q: any) => q.type !== "arcade",
  );

  return (
    <div className="space-y-6">
      <GalaxyHeader orgName={orgId} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[11px] text-sky-300/80">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-700/70 bg-slate-950/80 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
          <span className="uppercase tracking-[0.3em] text-sky-400/90">
            Linked ID
          </span>
          <span className="font-mono text-[10px] text-sky-100">
            {playerLabel}
          </span>
        </div>

        <Link
          href={`/bitgalaxy?${new URLSearchParams({ orgId }).toString()}`}
          className="inline-flex items-center gap-1 rounded-full border border-sky-500/40 px-3 py-1 text-[10px] text-sky-200 hover:bg-sky-500/10"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          Switch player
        </Link>
      </div>

      {/* PRIMARY HUD – cyberpunk XP cockpit */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/50 bg-slate-950/90 p-5 sm:p-6 shadow-[0_0_50px_rgba(34,211,238,0.45)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen [background-image:radial-gradient(circle_at_top_left,_rgba(56,189,248,0.4)_0,_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(129,140,248,0.35)_0,_transparent_55%),radial-gradient(circle_at_center,_rgba(16,185,129,0.28)_0,_transparent_60%)]"
        />

        <div className="relative grid gap-5 lg:grid-cols-[1.7fr_minmax(260px,1fr)]">
          {/* LEFT: XP + rank */}
          <div className="space-y-4">
            {/* player holo id */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 sm:h-14 sm:w-14">
                  <div className="absolute inset-0 rounded-2xl bg-[conic-gradient(from_140deg,rgba(34,211,238,0.85),rgba(16,185,129,0.9),rgba(129,140,248,0.85),rgba(34,211,238,0.9))] opacity-80 blur-[6px]" />
                  <div className="relative flex h-full w-full items-center justify-center rounded-2xl border border-sky-400/60 bg-slate-950/95 text-[9px] font-semibold uppercase tracking-[0.3em] text-sky-100">
                    ID
                  </div>
                </div>
                <div className="leading-tight">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-sky-300/85">
                    BitGalaxy · Player Console
                  </p>
                  <p className="mt-1 text-sm font-semibold text-sky-50 sm:text-base">
                    {playerLabel}
                  </p>
                  <p className="text-[11px] text-sky-300/80">
                    World:{" "}
                    <span className="font-mono text-sky-100">{orgId}</span>
                  </p>

                  {hasSignalLock && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/70 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
                      Signal lock calibrated
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-300/80">
                    Current Rank
                  </p>
                  <p className="mt-1 text-lg font-semibold text-emerald-100 sm:text-xl">
                    {player.rank}
                  </p>
                </div>
                <div className="hidden h-12 w-px bg-gradient-to-b from-emerald-400/70 via-sky-400/30 to-transparent sm:block" />
              </div>
            </div>

            {/* XP + tier stats */}
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div className="relative overflow-hidden rounded-2xl border border-emerald-400/50 bg-slate-950/95 p-4 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen [background-image:radial-gradient(circle_at_top,_rgba(52,211,153,0.4)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.25)_0,_transparent_55%)]"
                />
                <div className="relative flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-emerald-300/85">
                      Lifetime XP
                    </p>
                    <p className="text-[10px] text-emerald-200/80">
                      To next rank:{" "}
                      <span className="font-mono text-emerald-100">
                        {xpToNextRank.toLocaleString()}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-3xl font-bold leading-none text-emerald-100 sm:text-4xl">
                      {totalXP.toLocaleString()}
                    </p>
                    <div className="flex flex-col items-end text-[10px] text-emerald-200/85">
                      <span className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 font-semibold uppercase tracking-[0.22em]">
                        Signal: Stable
                      </span>
                      <span className="mt-1 text-[10px] text-emerald-200/70">
                        {activeCount} active / {completedCount} completed
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
                <div className="rounded-2xl border border-sky-500/50 bg-slate-950/95 p-3 text-[11px] text-sky-100 shadow-[0_0_24px_rgba(56,189,248,0.45)]">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-sky-300/85">
                    Tier window
                  </p>
                  {Number.isFinite(progress.tierMaxXP) ? (
                    <>
                      <p className="mt-1 font-mono text-[11px] text-sky-100">
                        {progress.tierMinXP} – {progress.tierMaxXP} XP
                      </p>
                      <p className="mt-1 text-[10px] text-sky-300/80">
                        You&apos;re{" "}
                        <span className="font-semibold text-sky-100">
                          {progress.progressPercent.toFixed(1)}%
                        </span>{" "}
                        through this rank.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-1 font-mono text-[11px] text-sky-100">
                        MAX RANK
                      </p>
                      <p className="mt-1 text-[10px] text-sky-300/80">
                        You&apos;ve hit the top of this ladder. Future seasons
                        can extend this window.
                      </p>
                    </>
                  )}
                </div>

                <div className="rounded-2xl border border-violet-500/50 bg-slate-950/95 p-3 text-[11px] text-violet-100 shadow-[0_0_24px_rgba(139,92,246,0.5)]">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-violet-300/85">
                    Quest status
                  </p>
                  <p className="mt-1 text-sm font-semibold text-violet-50">
                    {activeCount} mission
                    {activeCount === 1 ? "" : "s"} online
                  </p>
                  <p className="mt-1 text-[10px] text-violet-200/80">
                    Complete quests tonight to push this rank over the edge.
                  </p>
                </div>
              </div>
            </div>

            {/* XP progress bar + Arcade button */}
            <div className="rounded-2xl border border-emerald-500/40 bg-slate-950/95 p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-[11px] text-emerald-200/85">
                  <span className="font-semibold text-emerald-200">
                    Rank trajectory
                  </span>
                  <span>
                    {progress.currentXP} /{" "}
                    {Number.isFinite(progress.tierMaxXP)
                      ? progress.tierMaxXP
                      : "∞"}{" "}
                    currentXP out of{" "}
                    <span className="font-semibold text-emerald-100">
                      tierMaxXP
                    </span>
                  </span>
                </div>
                <div className="mt-1">
                  <XPProgressBar
                    rank={progress.rank}
                    currentXP={progress.currentXP}
                    tierMinXP={progress.tierMinXP}
                    tierMaxXP={progress.tierMaxXP}
                    progressPercent={progress.progressPercent}
                  />
                </div>

                {/* Open Arcade / Games */}
                <div className="mt-3 flex justify-center">
                  <Link
                    href={`/bitgalaxy/games${userQuery}`}
                    className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-[11px] font-semibold text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.7)] transition hover:bg-sky-400"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
                    Open Arcade / View Games
                  </Link>
                </div>

                {/* Optional mini quest grid in HUD – non-arcade only */}
                {nonArcadeQuestsForDisplay.length > 0 && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {nonArcadeQuestsForDisplay.map((quest) => (
                      <QuestCard
                        key={quest.id}
                        quest={quest}
                        orgId={orgId}
                        userId={userId}
                        playHref={null}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: quick nav + mini console */}
          <div className="space-y-4">
            <div className="grid gap-3 text-[11px] sm:grid-cols-3 lg:grid-cols-1">
              <Link
                href={`/bitgalaxy/history${userQuery}`}
                className="group rounded-2xl border border-sky-500/40 bg-slate-950/95 p-3 shadow-[0_0_20px_rgba(56,189,248,0.5)] transition hover:border-sky-400/90 hover:shadow-[0_0_30px_rgba(56,189,248,0.8)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-sky-300/90">
                    Completed quests
                  </span>
                  <span className="text-[10px] text-sky-200/70">
                    Log &gt;
                  </span>
                </div>
                <p className="mt-1 text-2xl font-semibold text-sky-50">
                  {completedCount}
                </p>
                <p className="mt-1 text-[10px] text-sky-200/80">
                  Your permanent trail of operations in this world.
                </p>
              </Link>

              <Link
                href={`/bitgalaxy/profile${userQuery}`}
                className="group rounded-2xl border border-violet-500/40 bg-slate-950/95 p-3 shadow-[0_0_20px_rgba(139,92,246,0.55)] transition hover:border-violet-400/90 hover:shadow-[0_0_30px_rgba(139,92,246,0.85)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-violet-300/90">
                    Profile matrix
                  </span>
                  <span className="text-[10px] text-violet-200/70">
                    Open &gt;
                  </span>
                </div>
                <p className="mt-2 text-[12px] font-semibold text-violet-50">
                  Inspect your rank, XP spread, and alignment across programs.
                </p>
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/95 p-4 text-[11px] text-slate-200 shadow-[0_0_28px_rgba(15,23,42,0.95)]">
              <h3 className="text-[12px] font-semibold text-slate-50">
                Navigation Matrix
              </h3>
              <p className="mt-1 text-[10px] text-slate-300/85">
                Jump to other consoles linked to this world.
              </p>

              <div className="mt-3 grid gap-2">
                <Link
                  href={`/bitgalaxy/checkin${userQuery}`}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/95 px-3 py-2 transition hover:border-emerald-400/80 hover:bg-slate-900"
                >
                  <span>Player check-in terminal</span>
                  <span className="text-slate-400">&gt;</span>
                </Link>
                <Link
                  href={`/bitgalaxy/leaderboards${userQuery}`}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/95 px-3 py-2 transition hover:border-sky-400/80 hover:bg-slate-900"
                >
                  <span>World leaderboards</span>
                  <span className="text-slate-400">&gt;</span>
                </Link>
                <Link
                  href={`/bitgalaxy/worlds${userQuery}`}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/95 px-3 py-2 transition hover:border-violet-400/80 hover:bg-slate-900"
                >
                  <span>World explorer</span>
                  <span className="text-slate-400">&gt;</span>
                </Link>
                <Link
                  href={`/bitgalaxy/notifications${userQuery}`}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/95 px-3 py-2 transition hover:border-sky-300/80 hover:bg-slate-900"
                >
                  <span>View notifications</span>
                  <span className="text-slate-400">&gt;</span>
                </Link>
                <Link
                  href={`/bitgalaxy/settings${userQuery}`}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/95 px-3 py-2 transition hover:border-slate-400/80 hover:bg-slate-900"
                >
                  <span>Player settings</span>
                  <span className="text-slate-400">&gt;</span>
                </Link>
              </div>
            </div>

            <p className="text-[10px] text-slate-400/85">
              All operations here feed the BitGalaxy engine and ripple across
              the Neon Ecosystem — RewardCircle, Referralink, and future
              NeonMatrix feeds.
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
              Owner of this world?{" "}
              <a
                href={`/hq/${encodeURIComponent(orgId)}/bitgalaxy`}
                className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
              >
                Open the BitGalaxy console in NeonHQ
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* SECONDARY GRID: quest feed + supporting copy */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <div className="relative overflow-hidden rounded-2xl border border-sky-500/40 bg-slate-950/90 p-5 shadow-[0_0_36px_rgba(56,189,248,0.4)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-35 mix-blend-screen [background-image:radial-gradient(circle_at_top,_rgba(56,189,248,0.28)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.22)_0,_transparent_55%)]"
          />

          <div className="relative space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-sky-50">
                Tonight&apos;s available quests
              </h2>
              <span className="rounded-full border border-sky-500/60 bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium text-sky-100">
                {nonArcadeQuestsForDisplay.length} contract
                {nonArcadeQuestsForDisplay.length === 1 ? "" : "s"} online
              </span>
            </div>

            {nonArcadeQuestsForDisplay.length === 0 ? (
              <p className="rounded-xl border border-sky-500/40 bg-slate-950/95 px-4 py-3 text-xs text-sky-100/85">
                No quests available yet. Once an owner configures missions for
                this world in NeonHQ &gt; BitGalaxy, they&apos;ll appear here
                as contracts you can accept.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {nonArcadeQuestsForDisplay.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    orgId={orgId}
                    userId={userId}
                    playHref={null}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-3 text-[11px] text-slate-300/85">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/95 p-4 shadow-[0_0_28px_rgba(15,23,42,0.9)]">
            <h3 className="text-[12px] font-semibold text-sky-50">
              How this dashboard works
            </h3>
            <p className="mt-1">
              Every check-in, quest, and reward funnels XP into the BitGalaxy
              core. This console shows your <strong>personal leaderboard</strong>{" "}
              for this world — rank, trajectory, and active missions.
            </p>
            <p className="mt-2 text-slate-400">
              When we bring the Global Arcade online, this same ID will let you
              earn XP even while you&apos;re waiting in line.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}