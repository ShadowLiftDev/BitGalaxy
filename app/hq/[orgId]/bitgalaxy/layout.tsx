import Link from "next/link";
import type { ReactNode } from "react";
import { adminDb } from "@/lib/firebase-admin";

type BitGalaxyLayoutProps = {
  children: ReactNode;
  params: Promise<{ orgId: string }>;
};

const NAV_LINKS: { slug: string; label: string }[] = [
  { slug: "", label: "Dashboard" },
  { slug: "programs", label: "XP Programs" },
  { slug: "quests", label: "Quest Library" },
  { slug: "leaderboards", label: "Leaderboards" },
  { slug: "analytics", label: "Analytics" },
  { slug: "integrations", label: "Integrations" },
  { slug: "settings", label: "World Settings" },
];

export const metadata = {
  title: "BitGalaxy – Org Console",
  description: "Admin control panel for the BitGalaxy engine inside NeonHQ.",
};

export default async function BitGalaxyLayout({
  children,
  params,
}: BitGalaxyLayoutProps) {
  const { orgId } = await params;
  const decodedOrgId = decodeURIComponent(orgId);

  let orgName = decodedOrgId;
  try {
    const orgSnap = await adminDb.collection("orgs").doc(decodedOrgId).get();
    if (orgSnap.exists) {
      const data = orgSnap.data() as any;
      if (typeof data?.name === "string" && data.name.trim()) {
        orgName = data.name.trim();
      }
    }
  } catch (err) {
    console.error("BitGalaxyLayout: error loading org name", err);
  }

  const basePath = `/hq/neon-lunchbox/bitgalaxy`;
  const neonHQPath = `/hq/neon-lunchbox`;

  return (
    <div className="min-h-screen flex items-start justify-center px-3 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-6xl space-y-4 sm:space-y-6">
        <header className="rounded-2xl border border-sky-500/60 bg-slate-950/85 px-4 py-3 shadow-[0_0_45px_rgba(56,189,248,0.5)] backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-400/90 bg-slate-950 text-[11px] font-bold tracking-tight text-sky-100 shadow-[0_0_22px_rgba(56,189,248,0.95)]">
                BG
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-sky-50">
                  BitGalaxy · Org Console
                </span>
                <span className="text-[11px] text-sky-300/85">
                  XP, quests, and rewards engine for{" "}
                  <span className="font-semibold text-sky-100">{orgName}</span>
                  <span className="ml-1 font-mono text-sky-400/80">
                    (orgs/neon-lunchbox)
                  </span>
                  .
                </span>
              </div>
            </div>

            <nav className="flex flex-wrap gap-1.5 text-[11px] text-sky-200">
              {NAV_LINKS.map(({ slug, label }) => {
                const href = slug === "" ? basePath : `${basePath}/${slug}`;
                return (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-full border border-sky-500/50 bg-slate-900/80 px-3 py-1.5 hover:bg-sky-500/15 transition-colors"
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        <main className="rounded-2xl border border-sky-500/40 bg-slate-950/90 p-4 sm:p-6 shadow-[0_0_32px_rgba(15,23,42,0.95)]">
          {children}
        </main>

        <footer className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-sky-500/25 bg-slate-950/80 px-4 py-3 text-[11px] text-sky-300/85">
          <div className="space-y-0.5">
            <div className="font-semibold text-sky-100">{orgName}</div>
            <div className="font-mono text-[10px] text-sky-400/80">
              orgs/neon-lunchbox/bitgalaxy
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link
              href={neonHQPath}
              className="rounded-full border border-sky-500/50 bg-slate-900/80 px-3 py-1.5 text-[11px] font-medium hover:bg-sky-500/15 transition-colors"
            >
              ← Back to NeonHQ
            </Link>
            <span className="text-[10px] text-sky-500/80">
              Part of the NeonHQ stack.
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}