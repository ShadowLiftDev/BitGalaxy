import { GalaxyHeader } from "@/components/bitgalaxy/GalaxyHeader";
import { getInventory } from "@/lib/bitgalaxy/getInventory";
import { getServerUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";

const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? "neon-lunchbox";

export const metadata = {
  title: "BitGalaxy – Inventory",
};

export default async function BitGalaxyInventoryPage() {
  const orgId = DEFAULT_ORG_ID;

  // Require an authenticated player
  const user = await getServerUser();
  if (!user) {
    redirect("/login?from=/bitgalaxy/inventory");
  }

  const userId = user.uid;
  const items = await getInventory(orgId, userId);

  return (
    <div className="space-y-6">
      <GalaxyHeader orgName={orgId} />

      <section className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-slate-950/85 p-5 shadow-[0_0_40px_rgba(16,185,129,0.35)]">
        {/* holo panel */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen [background-image:radial-gradient(circle_at_top,_rgba(16,185,129,0.3)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(34,197,235,0.22)_0,_transparent_55%),linear-gradient(135deg,rgba(15,23,42,0.98)_0,rgba(15,23,42,0.9)_40%,rgba(15,23,42,0.9)_60%,rgba(15,23,42,0.98)_100%)]"
        />

        <div className="relative space-y-4">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
                Asset Locker
              </div>
              <h2 className="mt-2 text-lg font-semibold text-emerald-50">
                Inventory Cache
              </h2>
              <p className="text-xs text-emerald-100/80">
                Keys, tickets, relics and special artifacts you&apos;ve pulled
                from quests and events in this world.
              </p>
            </div>

            <div className="text-right text-[11px] text-emerald-200/80">
              <p>
                Total items:{" "}
                <span className="font-semibold text-emerald-100">
                  {items.length}
                </span>
              </p>
              <p className="mt-0.5 text-[10px] text-emerald-200/60">
                Some items may unlock bonus quests or secret reward paths.
              </p>
            </div>
          </header>

          {items.length === 0 ? (
            <div className="mt-2 rounded-xl border border-emerald-500/40 bg-slate-950/95 px-4 py-4 text-xs text-emerald-100/85">
              <p className="font-medium text-emerald-100">
                Your locker is empty.
              </p>
              <p className="mt-1 text-emerald-200/85">
                Complete quests, streak your check-ins, or hit XP thresholds to
                begin filling this cache with digital trophies and live-world
                rewards.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.itemId}
                  className="group relative overflow-hidden rounded-xl border border-emerald-500/35 bg-slate-950/90 p-3 text-xs text-emerald-50 shadow-[0_0_25px_rgba(15,23,42,0.95)] transition hover:border-emerald-400/80 hover:shadow-[0_0_35px_rgba(16,185,129,0.7)]"
                >
                  {/* glow sweep */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 translate-y-6 bg-gradient-to-t from-transparent via-emerald-400/10 to-transparent opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100"
                  />

                  <div className="relative flex items-center justify-between gap-2">
                    <h3 className="text-[13px] font-semibold text-emerald-50">
                      {item.label ?? item.itemId}
                    </h3>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                      x{item.quantity ?? 1}
                    </span>
                  </div>

                  {item.description && (
                    <p className="relative mt-1 line-clamp-3 text-[11px] text-emerald-100/75">
                      {item.description}
                    </p>
                  )}

                  <div className="relative mt-2 flex items-center justify-between text-[10px] text-emerald-200/80">
                    {item.source && (
                      <p>
                        Source:{" "}
                        <span className="font-mono text-emerald-200">
                          {item.source}
                        </span>
                      </p>
                    )}
                    {item.createdAt && (
                      <p className="font-mono opacity-80">
                        ID:{" "}
                        <span className="text-emerald-300/90">
                          {item.itemId.slice(0, 6)}…
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <footer className="mt-3 text-[11px] text-emerald-200/80">
            Items are scoped per world. In future expansions, cross-world
            inventory transfers and season vaults can unlock advanced
            progression routes.
          </footer>
        </div>
      </section>
    </div>
  );
}