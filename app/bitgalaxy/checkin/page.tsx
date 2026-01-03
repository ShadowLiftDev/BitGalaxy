import { redirect } from "next/navigation";
import { GalaxyHeader } from "@/components/bitgalaxy/GalaxyHeader";
import { CheckinPanel } from "@/components/bitgalaxy/CheckinPanel";

const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? "neon-lunchbox";

export const metadata = {
  title: "BitGalaxy – Check In",
};

type BitGalaxyCheckinPageProps = {
  searchParams: Promise<{ userId?: string; orgId?: string }>;
};

export default async function BitGalaxyCheckinPage({
  searchParams,
}: BitGalaxyCheckinPageProps) {
  const resolved = (await searchParams) ?? {};
  const orgId = resolved.orgId ?? DEFAULT_ORG_ID;
  const userId = resolved.userId ?? null;

  // No player identity in URL → bounce back to player console (which has the lookup gate)
  if (!userId) {
    redirect("/bitgalaxy");
  }

  return (
    <div className="space-y-6">
      <GalaxyHeader orgName={orgId} />

      <section className="relative overflow-hidden rounded-2xl border border-sky-500/40 bg-slate-950/80 p-5 shadow-[0_0_40px_rgba(56,189,248,0.35)]">
        {/* nebula / scan overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen [background-image:radial-gradient(circle_at_top,_rgba(56,189,248,0.3)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.25)_0,_transparent_55%),linear-gradient(135deg,rgba(15,23,42,0.98)_0,rgba(15,23,42,0.9)_40%,rgba(15,23,42,0.9)_60%,rgba(15,23,42,0.98)_100%)]"
        />

        <div className="relative space-y-4">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-sky-300">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.9)]" />
                Check-In Terminal
              </div>
              <h2 className="mt-2 text-lg font-semibold text-sky-50">
                Log Your Presence
              </h2>
              <p className="text-xs text-sky-100/75">
                Scan the code or enter the access key to sync this visit to your
                BitGalaxy timeline and XP ledger.
              </p>
            </div>

            <div className="text-right text-[11px] text-sky-200/80">
              <p className="font-medium">Org Channel</p>
              <p className="text-sky-300">{orgId}</p>
              <p className="mt-1 text-[10px] text-sky-200/60">
                Each successful check-in can trigger quests and rewards.
              </p>
            </div>
          </header>

          <div className="mt-2">
            <CheckinPanel orgId={orgId} userId={userId} />
          </div>

          <footer className="mt-3 text-[11px] text-sky-200/70">
            <p>
              Pro tip: Chain check-ins with active quests to maximize XP gain.
              Some quests only unlock after a streak of flawless entries.
            </p>
          </footer>
        </div>
      </section>
    </div>
  );
}