"use client";

import Link from "next/link";
import { Home, Bell, Gamepad2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

export function BitGalaxyTopChrome() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  // If a player is selected, keep ?userId= in all BitGalaxy links
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";

  const homeHref = `/bitgalaxy${query}`;
  const notificationsHref = `/bitgalaxy/notifications${query}`;
  const gamesHref = `/bitgalaxy/games${query}`;

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px] text-slate-300 shadow-[0_0_40px_rgba(15,23,42,0.9)]">
      {/* LEFT SIDE — Logo/Home Link */}
      <Link href={homeHref}>
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
          href={homeHref}
          className="rounded-full p-1 text-slate-300 transition hover:bg-slate-800 hover:text-sky-300"
        >
          <Home size={16} strokeWidth={2} />
        </Link>

        {/* Notifications icon */}
        <Link
          href={notificationsHref}
          className="rounded-full p-1 text-slate-300 transition hover:bg-slate-800 hover:text-amber-300"
        >
          <Bell size={16} strokeWidth={2} />
        </Link>

        {/* Arcade button → games landing page */}
        <Link
          href={gamesHref}
          className="inline-flex items-center gap-1 rounded-full border border-sky-500/60 bg-slate-950/80 px-2.5 py-1 text-[10px] font-semibold text-sky-100 shadow-[0_0_16px_rgba(56,189,248,0.45)] transition hover:bg-sky-500/10 hover:text-sky-200"
        >
          <Gamepad2 size={14} strokeWidth={2} />
          <span>Arcade</span>
        </Link>

        {/* Text version tag */}
        <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-0.5 font-mono text-[10px] text-slate-300">
          v2 · MULTI-WORLD
        </span>
      </div>
    </div>
  );
}