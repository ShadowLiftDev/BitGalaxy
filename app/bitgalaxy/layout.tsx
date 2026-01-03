import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { BitGalaxyTopChrome } from "./BitGalaxyTopChrome";

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
            {/* top chrome bar (now userId-aware) */}
            <BitGalaxyTopChrome />

            {/* page content */}
            <div className="space-y-6">{children}</div>
          </div>
        </main>
      </div>
    </AuthProvider>
  );
}