import { GalaxyHeader } from "@/components/bitgalaxy/GalaxyHeader";
import { getHistory } from "@/lib/bitgalaxy/getHistory";
import { getServerUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";

const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? "neon-lunchbox";

export const metadata = {
  title: "BitGalaxy – History",
};

function formatTimestamp(ts: FirebaseFirestore.Timestamp | null | undefined) {
  if (!ts || !ts.toDate) return "";
  const d = ts.toDate();
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}

function formatEventType(eventType: string): string {
  switch (eventType) {
    case "quest_complete":
      return "Quest completed";
    case "checkin":
      return "Check-in";
    case "reward_redeem":
      return "Reward redeemed";
    case "referral":
      return "Referral";
    case "xp":
      return "XP adjustment";
    default:
      return eventType;
  }
}

export default async function BitGalaxyHistoryPage() {
  const orgId = DEFAULT_ORG_ID;

  // Require an authenticated player
  const user = await getServerUser();
  if (!user) {
    redirect("/login?from=/bitgalaxy/history");
  }

  const userId = user.uid;
  const entries = await getHistory(orgId, userId, 50);

  return (
    <div className="space-y-6">
      <GalaxyHeader orgName={orgId} />

      <section className="relative overflow-hidden rounded-2xl border border-sky-500/40 bg-slate-950/80 p-5 shadow-[0_0_40px_rgba(56,189,248,0.35)]">
        {/* holo grid overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen [background-image:radial-gradient(circle_at_top,_rgba(56,189,248,0.28)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.25)_0,_transparent_55%),linear-gradient(90deg,rgba(15,23,42,0.98)_0,rgba(15,23,42,0.9)_40%,rgba(15,23,42,0.9)_60%,rgba(15,23,42,0.98)_100%)]"
        />

        <div className="relative space-y-4">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-sky-300">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
                Activity Log
              </div>
              <h2 className="mt-2 text-lg font-semibold text-sky-50">
                Timeline of Operations
              </h2>
              <p className="text-xs text-sky-100/75">
                Every check-in, quest completion, and XP pulse recorded in your
                BitGalaxy stream.
              </p>
            </div>
            <div className="text-right text-[11px] text-sky-200/80">
              <p>
                Tracking{" "}
                <span className="font-semibold text-sky-100">
                  {entries.length}
                </span>{" "}
                event{entries.length === 1 ? "" : "s"}
              </p>
              <p className="mt-0.5 text-[10px] text-sky-200/60">
                Latest events appear at the top of the feed.
              </p>
            </div>
          </header>

          {entries.length === 0 ? (
            <div className="mt-2 rounded-xl border border-sky-500/40 bg-slate-950/90 px-4 py-4 text-xs text-sky-100/80">
              <p className="font-medium text-sky-100">
                Silent grid. No signals yet.
              </p>
              <p className="mt-1 text-sky-200/80">
                Once you begin checking in and completing quests, your full
                operation history will materialize here as a chronological
                pulse-trace.
              </p>
            </div>
          ) : (
            <div className="relative mt-4">
              {/* vertical timeline spine */}
              <div className="pointer-events-none absolute inset-y-0 left-2 w-px bg-gradient-to-b from-sky-500/60 via-sky-400/10 to-transparent" />
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="relative ml-5 rounded-xl border border-slate-800/80 bg-slate-950/90 px-4 py-3 text-xs text-sky-100 shadow-[0_0_20px_rgba(15,23,42,0.9)]"
                  >
                    {/* timeline node */}
                    <span className="absolute left-[-13px] top-3 h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.9)]" />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">
                          {formatEventType(entry.eventType)}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-sky-300/80">
                        {formatTimestamp(entry.timestamp)}
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-sky-200/85">
                      <span>
                        XP delta:{" "}
                        <span
                          className={
                            entry.xpChange > 0
                              ? "font-semibold text-emerald-300"
                              : entry.xpChange < 0
                              ? "font-semibold text-red-300"
                              : "font-semibold text-sky-200"
                          }
                        >
                          {entry.xpChange > 0
                            ? `+${entry.xpChange}`
                            : entry.xpChange}
                        </span>
                      </span>

                      {entry.questId && (
                        <span>
                          Quest ID:{" "}
                          <span className="font-mono text-sky-200/90">
                            {entry.questId}
                          </span>
                        </span>
                      )}

                      {entry.rewardId && (
                        <span>
                          Reward:{" "}
                          <span className="font-mono text-emerald-200/90">
                            {entry.rewardId}
                          </span>
                        </span>
                      )}

                      {entry.source && (
                        <span>
                          Source:{" "}
                          <span className="font-mono text-sky-300/90">
                            {entry.source}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <footer className="mt-3 text-[11px] text-sky-200/75">
            Activity is logged per world. As you expand into more BitGalaxy
            worlds, each will maintain its own encrypted trail of your actions.
          </footer>
        </div>
      </section>
    </div>
  );
}