import Link from "next/link";
import { GalaxyHeader } from "@/components/bitgalaxy/GalaxyHeader";
import { PlayerLookupGate } from "@/components/bitgalaxy/PlayerLookupGate";
import { getPlayer } from "@/lib/bitgalaxy/getPlayer";
import { getServerUser } from "@/lib/auth-server";
import { SignalLockGame } from "@/components/bitgalaxy/SignalLockGame";

const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? "neon-lunchbox";

type TutorialPageProps = {
  // Match the other BitGalaxy pages: Promise-based searchParams
  searchParams: Promise<{ userId?: string }>;
};

export const metadata = {
  title: "BitGalaxy – Signal Lock Tutorial",
};

export default async function BitGalaxyTutorialPage({
  searchParams,
}: TutorialPageProps) {
  const orgId = DEFAULT_ORG_ID;

  // Priority:
  // 1) explicit ?userId= in URL (for kiosk / staff)
  // 2) authenticated user from Firebase
  // 3) fall back to PlayerLookupGate
  const resolvedSearch = (await searchParams) ?? {};
  let userId = resolvedSearch.userId ?? null;

  if (!userId) {
    const user = await getServerUser();
    if (user) {
      userId = user.uid;
    }
  }

  // If we *still* don't have a user, show lookup gate
  if (!userId) {
    return (
      <div className="space-y-6">
        <GalaxyHeader orgName={orgId} />
        <section className="mt-2">
          <PlayerLookupGate orgId={orgId} />
        </section>
      </div>
    );
  }

  // Load player to see if Signal Lock is already completed
  const player = await getPlayer(orgId, userId);
  const hasCompleted =
    (player as any)?.specialEvents?.signalLockCompleted === true;

  return (
    <div className="space-y-6">
      <GalaxyHeader orgName={orgId} />

      <div className="flex items-center justify-between text-[11px] text-sky-300/80">
        <span>
          Tutorial for player:{" "}
          <span className="font-mono text-sky-100">{userId}</span>
        </span>
        <Link
          href={`/bitgalaxy?userId=${encodeURIComponent(userId)}`}
          className="rounded-full border border-sky-500/40 px-2 py-1 text-[10px] hover:bg-sky-500/10"
        >
          Back to dashboard
        </Link>
      </div>

      <section className="rounded-2xl border border-sky-500/40 bg-slate-950/85 p-4 shadow-[0_0_30px_rgba(56,189,248,0.4)]">
        {hasCompleted ? (
          <div className="space-y-2 text-sm text-sky-100">
            <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-300">
              Signal Lock · Cleared
            </p>
            <h2 className="text-lg font-semibold text-emerald-100">
              You&apos;ve already cracked this signal.
            </h2>
            <p className="text-[13px] text-sky-200/85">
              This mission is one-time only for this world. Your XP has been
              logged to your BitGalaxy dashboard. Check your rank progression to
              see how far it pushed you.
            </p>
          </div>
        ) : (
          <SignalLockGame orgId={orgId} userId={userId} />
        )}
      </section>
    </div>
  );
}