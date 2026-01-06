import Link from "next/link";
import { GalaxyHeader } from "@/components/bitgalaxy/GalaxyHeader";
import { PlayerLookupGate } from "@/components/bitgalaxy/PlayerLookupGate";
import { getPlayer } from "@/lib/bitgalaxy/getPlayer";
import { getQuests } from "@/lib/bitgalaxy/getQuests";

const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? "neon-lunchbox";

type BitGalaxyGamesPageProps = {
  // In your setup, searchParams is passed as a Promise
  searchParams?: Promise<{
    orgId?: string;
    userId?: string;
    guest?: string;
  }>;
};

export const metadata = {
  title: "BitGalaxy – Arcade Missions",
};

function withParams(path: string, params: Record<string, string | undefined | null>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") sp.set(k, String(v));
  });
  return `${path}?${sp.toString()}`;
}

export default async function BitGalaxyGamesPage(
  props: BitGalaxyGamesPageProps,
) {
  const resolvedSearch = (props.searchParams
    ? await props.searchParams
    : {}) as { orgId?: string; userId?: string; guest?: string };

  const orgId = (resolvedSearch.orgId ?? DEFAULT_ORG_ID).trim();

  // Guest flag (no XP / no persistence)
  const isGuest = resolvedSearch.guest === "1";

  // Player identity comes ONLY from URL, unless guest
  const userId =
    !isGuest && resolvedSearch.userId ? resolvedSearch.userId : null;

  // If no player selected and not in guest mode -> show lookup gate
  if (!userId && !isGuest) {
    return (
      <div className="space-y-6">
        <GalaxyHeader orgName={orgId} />

        <section className="mt-2 space-y-4">
          <div className="rounded-2xl border border-amber-500/30 bg-slate-950/90 p-4 text-[11px] text-amber-100">
            <h1 className="text-base font-semibold text-amber-50">
              Link your BitGalaxy player profile
            </h1>
            <p className="mt-2 text-xs text-amber-200/85">
              Enter the phone or email you use at The Neon Lunchbox to locate
              your BitGalaxy player profile. Once selected, XP, ranks, and
              arcade records will be tied to that ID.
            </p>
          </div>

          {/* Player lookup form – redirects to /bitgalaxy?userId=XYZ */}
      <PlayerLookupGate
        orgId={orgId}
        redirectBase="/bitgalaxy/games"
        // optional, only if you want JOIN to go to NeonHQ landing from here too:
        joinRedirectUrl={`https://neon-hq.vercel.app/orgs/${encodeURIComponent(orgId)}/landing`}
      />

          <div className="mt-2 text-[11px] text-slate-300">
            <p>
              Or, continue in guest mode if you just want to try the games
              without logging XP:
            </p>
            <Link
              href={withParams("/bitgalaxy/games", { orgId, guest: "1" })}
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-600/70 bg-slate-950/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-sky-400/80 hover:text-sky-100"
            >
              Continue as guest (no XP)
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // From here on: either a real player (userId) OR guest mode
  let player: any = null;
  let quests: any[] = [];

  if (!isGuest && userId) {
    [player, quests] = await Promise.all([
      getPlayer(orgId, userId),
      getQuests(orgId, { activeOnly: true }),
    ]);
  }

  // 🔎 Derive arcade stats from specialEvents.*
  const rawEvents =
    !isGuest && player ? ((player as any).specialEvents || {}) : {};

  const neon = rawEvents.neonMemory || {};
  const galaxy = rawEvents.galaxyPaddle || {};
  const nebula = rawEvents.nebulaBreak || {};

  const neonMemoryCompleted = !!neon.weekKey;
  const galaxyPaddleCompleted = !!galaxy.weekKey;
  const nebulaBreakCompleted = !!nebula.weekKey;

  const neonMemoryStats = {
    bestTimeMs: neon.bestTimeMs ?? null,
    bestMoves: neon.bestMoves ?? null,
  };

  const galaxyPaddleStats = {
    bestHits: galaxy.bestHits ?? null,
    bestTimeMs: galaxy.bestTimeMs ?? null,
    bestMaxSpeed: galaxy.bestMaxSpeed ?? null,
  };

  const nebulaBreakStats = {
    bestScore: nebula.bestScore ?? null,
    bestBricks: nebula.bestBricks ?? null,
    bestTimeMs: nebula.bestTimeMs ?? null,
  };

  // XP values for each quest (fallbacks if a quest doc is missing)
  const neonMemoryQuest = quests.find((q) => q.id === "neon-memory");
  const galaxyPaddleQuest = quests.find((q) => q.id === "galaxy-paddle");
  const nebulaBreakQuest = quests.find((q) => q.id === "nebula-break");

  const neonMemoryXP = neonMemoryQuest?.xp ?? 50;
  const galaxyPaddleXP = galaxyPaddleQuest?.xp ?? 50;
  const nebulaBreakXP = nebulaBreakQuest?.xp ?? 75;

  const formatMsToSeconds = (ms?: number | null) => {
    if (typeof ms !== "number" || !Number.isFinite(ms)) return "–";
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const playerLabel =
    (!isGuest &&
      ((player as any)?.displayName || (player as any)?.name)) ||
    userId ||
    "Guest player";

  // At this point, if not guest, userId is guaranteed non-null
  const playerUserId = (userId ?? "") as string;

  return (
    <div className="space-y-6">
      <GalaxyHeader orgName={orgId} />

      {/* Guest mode banner */}
      {isGuest && (
        <div className="rounded-2xl border border-amber-400/60 bg-amber-500/10 px-4 py-2 text-[11px] text-amber-100">
          Guest mode · XP and high scores are disabled for this session. Link
          an account from the BitGalaxy dashboard to start earning.
        </div>
      )}

      {/* Top strip: Title + back to dashboard */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-[11px] text-sky-300/80">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-sky-400/90">
            BitGalaxy · Local Arcade
          </p>
          <h1 className="mt-1 text-lg font-semibold text-sky-50 sm:text-xl">
            Arcade Missions for {playerLabel}
          </h1>
          <p className="mt-1 text-[11px] text-sky-200/85">
            Complete each mini-game once to bank XP into this world. High
            scores are logged to your player ID.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={
          isGuest
            ? withParams("/bitgalaxy", { orgId })
            : withParams("/bitgalaxy", { orgId, userId: playerUserId })
            }
            className="inline-flex items-center gap-2 rounded-full border border-sky-500/50 bg-slate-950/80 px-3 py-1.5 text-[10px] font-semibold text-sky-100 shadow-[0_0_18px_rgba(56,189,248,0.5)] transition hover:bg-sky-500/10"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
            {isGuest ? "Open BitGalaxy dashboard" : "Return to player dashboard"}
          </Link>
        </div>
      </div>

      {/* Game cards grid */}
      <section className="grid gap-5 md:grid-cols-3">
        {/* Neon Memory */}
        <article className="relative flex flex-col rounded-2xl border border-sky-500/50 bg-slate-950/90 p-4 shadow-[0_0_32px_rgba(56,189,248,0.45)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen [background-image:radial-gradient(circle_at_top,_rgba(56,189,248,0.35)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.3)_0,_transparent_55%)]"
          />
          <div className="relative flex h-full flex-col">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.26em] text-sky-300/85">
                  Arcade Mission · 01
                </p>
                <h2 className="mt-1 text-sm font-semibold text-sky-50">
                  Neon Memory
                </h2>
                <p className="mt-1 text-[11px] text-sky-200/85">
                  Flip the neon tiles, remember the pattern, and clear the grid
                  as efficiently as possible.
                </p>
              </div>
              {!isGuest && neonMemoryCompleted && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/70 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
                  Completed
                </span>
              )}
            </div>

            <div className="mt-3 grid gap-2 text-[11px] text-sky-100 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-400/60 bg-emerald-500/10 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-300/90">
                  XP on completion
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-50">
                  +{neonMemoryXP} XP
                </p>
                <p className="mt-1 text-[10px] text-emerald-200/80">
                  One-time reward for clearing the grid.{" "}
                  {isGuest && "XP disabled in guest mode."}
                </p>
              </div>

              <div className="rounded-xl border border-sky-500/50 bg-slate-950/95 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.24em] text-sky-300/90">
                  Best run (logged)
                </p>
                {!isGuest &&
                (neonMemoryStats.bestTimeMs || neonMemoryStats.bestMoves) ? (
                  <div className="mt-1 space-y-1">
                    <p className="font-mono text-[11px] text-sky-100">
                      Time: {formatMsToSeconds(neonMemoryStats.bestTimeMs)}
                    </p>
                    <p className="font-mono text-[11px] text-sky-100">
                      Moves: {neonMemoryStats.bestMoves ?? "–"}
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-[10px] text-sky-300/80">
                    {isGuest
                      ? "Guest runs are not logged. Link an account to start tracking your times."
                      : "No run logged yet. Your first completion will record a baseline."}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Link
            href={
              isGuest
                ? withParams("/bitgalaxy/games/neon-memory", { orgId, guest: "1" })
                : withParams("/bitgalaxy/games/neon-memory", { orgId, userId: playerUserId })
            }
                className="inline-flex items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-[11px] font-semibold text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.7)] transition hover:bg-sky-400"
              >
                Launch Neon Memory
              </Link>
            </div>
          </div>
        </article>

        {/* Galaxy Paddle */}
        <article className="relative flex flex-col rounded-2xl border border-indigo-500/60 bg-slate-950/90 p-4 shadow-[0_0_32px_rgba(129,140,248,0.45)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen [background-image:radial-gradient(circle_at_top,_rgba(129,140,248,0.4)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.3)_0,_transparent_55%)]"
          />
          <div className="relative flex h-full flex-col">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.26em] text-indigo-300/85">
                  Arcade Mission · 02
                </p>
                <h2 className="mt-1 text-sm font-semibold text-indigo-50">
                  Galaxy Paddle
                </h2>
                <p className="mt-1 text-[11px] text-indigo-100/85">
                  Hold the defensive line. Keep the neon core in play as long as
                  you can while velocity climbs.
                </p>
              </div>
              {!isGuest && galaxyPaddleCompleted && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/70 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
                  Completed
                </span>
              )}
            </div>

            <div className="mt-3 grid gap-2 text-[11px] text-sky-100 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-400/60 bg-emerald-500/10 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-300/90">
                  XP on completion
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-50">
                  +{galaxyPaddleXP} XP
                </p>
                <p className="mt-1 text-[10px] text-emerald-200/80">
                  One-time reward for logging a full run.
                  {isGuest && " XP disabled in guest mode."}
                </p>
              </div>

              <div className="rounded-xl border border-indigo-500/60 bg-slate-950/95 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.24em] text-indigo-300/90">
                  Best run (logged)
                </p>
                {!isGuest &&
                (galaxyPaddleStats.bestHits ||
                  galaxyPaddleStats.bestTimeMs ||
                  galaxyPaddleStats.bestMaxSpeed) ? (
                  <div className="mt-1 space-y-1">
                    <p className="font-mono text-[11px] text-indigo-50">
                      Returns: {galaxyPaddleStats.bestHits ?? "–"}
                    </p>
                    <p className="font-mono text-[11px] text-indigo-50">
                      Time: {formatMsToSeconds(galaxyPaddleStats.bestTimeMs)}
                    </p>
                    <p className="font-mono text-[11px] text-indigo-50">
                      Max V:{" "}
                      {galaxyPaddleStats.bestMaxSpeed
                        ? galaxyPaddleStats.bestMaxSpeed.toFixed(1)
                        : "–"}
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-[10px] text-indigo-100/80">
                    {isGuest
                      ? "Guest runs are not logged. Link an account to start tracking your paddle records."
                      : "No run logged yet. Your first mission sets your personal paddle record."}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Link
            href={
              isGuest
                ? withParams("/bitgalaxy/games/galaxy-paddle", { orgId, guest: "1" })
                : withParams("/bitgalaxy/games/galaxy-paddle", { orgId, userId: playerUserId })
            }
                className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-4 py-2 text-[11px] font-semibold text-slate-950 shadow-[0_0_24px_rgba(129,140,248,0.7)] transition hover:bg-indigo-400"
              >
                Launch Galaxy Paddle
              </Link>
            </div>
          </div>
        </article>

        {/* Nebula Break */}
        <article className="relative flex flex-col rounded-2xl border border-amber-500/60 bg-slate-950/90 p-4 shadow-[0_0_32px_rgba(245,158,11,0.45)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen [background-image:radial-gradient(circle_at_top,_rgba(245,158,11,0.4)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.25)_0,_transparent_55%)]"
          />
          <div className="relative flex h-full flex-col">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.26em] text-amber-300/85">
                  Arcade Mission · 03
                </p>
                <h2 className="mt-1 text-sm font-semibold text-amber-50">
                  Nebula Break
                </h2>
                <p className="mt-1 text-[11px] text-amber-100/85">
                  Drive the core through neon brickfields. Chain hits, grab
                  power-ups, and chase a high score.
                </p>
              </div>
              {!isGuest && nebulaBreakCompleted && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/70 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
                  Completed
                </span>
              )}
            </div>

            <div className="mt-3 grid gap-2 text-[11px] text-sky-100 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-400/60 bg-emerald-500/10 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-300/90">
                  XP on completion
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-50">
                  +{nebulaBreakXP} XP
                </p>
                <p className="mt-1 text-[10px] text-emerald-200/80">
                  Higher score, same one-time XP — perfect for bragging rights.
                  {isGuest && " XP disabled in guest mode."}
                </p>
              </div>

              <div className="rounded-xl border border-amber-500/60 bg-slate-950/95 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.24em] text-amber-300/90">
                  Best run (logged)
                </p>
                {!isGuest &&
                (nebulaBreakStats.bestScore ||
                  nebulaBreakStats.bestBricks ||
                  nebulaBreakStats.bestTimeMs) ? (
                  <div className="mt-1 space-y-1">
                    <p className="font-mono text-[11px] text-amber-50">
                      Score: {nebulaBreakStats.bestScore ?? "–"}
                    </p>
                    <p className="font-mono text-[11px] text-amber-50">
                      Bricks: {nebulaBreakStats.bestBricks ?? "–"}
                    </p>
                    <p className="font-mono text-[11px] text-amber-50">
                      Time: {formatMsToSeconds(nebulaBreakStats.bestTimeMs)}
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-[10px] text-amber-100/80">
                    {isGuest
                      ? "Guest runs are not logged. Link an account to start posting official high scores."
                      : "No nebula shattered yet. First clear will set your high score."}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
          <Link
            href={
              isGuest
                ? withParams("/bitgalaxy/games/nebula-break", { orgId, guest: "1" })
                : withParams("/bitgalaxy/games/nebula-break", { orgId, userId: playerUserId })
            }
            className="inline-flex items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-[11px] font-semibold text-slate-950 shadow-[0_0_24px_rgba(245,158,11,0.7)] transition hover:bg-amber-400"
          >
            Launch Nebula Break
          </Link>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}