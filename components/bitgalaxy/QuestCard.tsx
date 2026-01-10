"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Quest = {
  id: string;
  name?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  xpReward?: number;
  type?: string; // "standard" | "arcade" | etc.
  status?: string; // "active", "completed", etc.
  tags?: string[];
  [key: string]: any;
};

type QuestCardProps = {
  quest: Quest;
  orgId: string;
  userId?: string | null;
  /**
   * For arcade quests, pass a fully built href (e.g. /bitgalaxy/games/neon-memory?orgId=...&userId=...)
   * For non-arcade quests, leave this null and we show "Accept quest" instead.
   */
  playHref?: string | null;
};

export function QuestCard({ quest, orgId, userId, playHref }: QuestCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const title = quest.name || quest.title || "Untitled quest";
  const subtitle = quest.subtitle;
  const description = quest.description;
const xpReward =
  typeof quest.xpReward === "number"
    ? quest.xpReward
    : typeof (quest as any).xp === "number"
    ? (quest as any).xp
    : typeof (quest as any).rewardXP === "number"
    ? (quest as any).rewardXP
    : undefined;

  const isArcade = quest.type === "arcade";

  const isCompleted =
    quest.status === "completed" ||
    quest.completed === true ||
    quest.playerCompleted === true;

  const isActive =
    quest.status === "active" ||
    quest.active === true ||
    quest.playerActive === true;

  const canAccept =
    !!userId && !isArcade && !isCompleted && !isActive; // basic guard

  function handleAcceptClick() {
    if (!userId || isPending) return;

    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/bitgalaxy/quests/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // 🔑 send playerSession cookie
          body: JSON.stringify({
            orgId,
            questId: quest.id,
          }),
        });

        const json = await res.json().catch(() => ({} as any));

        if (!res.ok) {
          throw new Error(
            json?.error ||
              json?.message ||
              "We couldn’t start that quest. Please try again."
          );
        }

        // On success, refresh the page so HUD + quest status update
        router.refresh();
      } catch (err: any) {
        console.error("Start quest failed:", err);
        setError(
          err?.message ||
            "We couldn’t start that quest. Please try again in a moment."
        );
      }
    });
  }

  return (
    <article className="relative flex flex-col justify-between rounded-2xl border border-sky-500/40 bg-slate-950/95 p-4 text-[11px] text-sky-100 shadow-[0_0_26px_rgba(56,189,248,0.35)]">
      {/* top label row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold text-sky-50">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-[10px] text-sky-300/85">{subtitle}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          {typeof xpReward === "number" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/70 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
              +{xpReward.toLocaleString()} XP
            </span>
          )}

          {/* status chip */}
          {isCompleted ? (
            <span className="rounded-full border border-slate-500/70 bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-200">
              Completed
            </span>
          ) : isActive ? (
            <span className="rounded-full border border-sky-500/70 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-100">
              Accepted
            </span>
          ) : isArcade ? (
            <span className="rounded-full border border-violet-500/70 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-100">
              Arcade
            </span>
          ) : null}
        </div>
      </div>

      {/* body copy */}
      {description && (
        <p className="mt-2 line-clamp-3 text-[11px] text-sky-100/85">
          {description}
        </p>
      )}

      {/* tags, if any */}
      {Array.isArray(quest.tags) && quest.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {quest.tags.map((tag: string) => (
            <span
              key={tag}
              className="rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* footer actions */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {/* left: error, if any */}
        <div className="min-h-[1.2em] text-[10px] text-rose-300">
          {error}
        </div>

        {/* right: action button(s) */}
        {isArcade && playHref ? (
          <Link
            href={playHref}
            className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 shadow-[0_0_18px_rgba(56,189,248,0.75)] transition hover:bg-sky-400"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
            Play now
          </Link>
        ) : canAccept ? (
          <button
            type="button"
            onClick={handleAcceptClick}
            disabled={isPending}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 shadow-[0_0_18px_rgba(16,185,129,0.75)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-slate-950" />
            {isPending ? "Accepting…" : "Accept quest"}
          </button>
        ) : isCompleted ? (
          <span className="text-[10px] text-slate-400">
            Quest complete
          </span>
        ) : isActive ? (
          <span className="text-[10px] text-sky-300">
            Quest accepted
          </span>
        ) : !userId ? (
          <span className="text-[10px] text-slate-400">
            Link your player ID to accept
          </span>
        ) : null}
      </div>
    </article>
  );
}