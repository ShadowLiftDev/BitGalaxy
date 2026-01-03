import type { ReactNode } from "react";
import Link from "next/link";
import { Home, Bell, Gamepad2 } from "lucide-react";
import { AuthProvider } from "@/components/auth/AuthProvider";

export const metadata = {
  title: "BitGalaxy",
  description: "Gamified XP engine for The Neon Ecosystem.",
};

export default function BitGalaxyLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="relative min-h-screen bg-slate-950 text-slate-50">
        {/* cosmic gradient backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 opacity-70 [background-image:radial-gradient(circle_at_top,_rgba(56,189,248,0.25)_0,_transparent_60%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.23)_0,_transparent_60%),radial-gradient(circle_at_center,_rgba(129,140,248,0.18)_0,_transparent_55%)]"
        />

        {/* subtle grid overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.75)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.75)_1px,transparent_1px)] bg-[size:40px_40px] opacity-60 mix-blend-soft-light"
        />

        <main className="relative z-10 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-6">
            {/* top chrome bar */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px] text-slate-300 shadow-[0_0_40px_rgba(15,23,42,0.9)]">
              {/* LEFT SIDE — Logo/Home Link */}
              <Link href="/bitgalaxy">
                <div className="inline-flex cursor-pointer items-center gap-2 transition hover:text-sky-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
                  <span className="font-semibold tracking-[0.18em] text-slate-100">
                    BITGALAXY CLIENT
                  </span>
                </div>
              </Link>

              {/* RIGHT SIDE — Icons + Info */}
              <div className="flex items-center gap-3">
                {/* Home icon */}
                <Link
                  href="/bitgalaxy"
                  className="rounded-full p-1 text-slate-300 transition hover:bg-slate-800 hover:text-sky-300"
                >
                  <Home size={16} strokeWidth={2} />
                </Link>

                {/* Notifications icon */}
                <Link
                  href="/bitgalaxy/notifications"
                  className="rounded-full p-1 text-slate-300 transition hover:bg-slate-800 hover:text-amber-300"
                >
                  <Bell size={16} strokeWidth={2} />
                </Link>

                {/* Text version tag */}
                <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-0.5 font-mono text-[10px] text-slate-300">
                  v2 · MULTI-WORLD
                </span>
              </div>
            </div>

            {/* page content */}
            <div className="space-y-6">{children}</div>
          </div>
        </main>
      </div>
    </AuthProvider>
  );
}