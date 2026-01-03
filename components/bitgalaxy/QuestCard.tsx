import Link from "next/link";
import type { BitGalaxyQuest } from "@/lib/bitgalaxy/getQuests";

type QuestStatusBadge = "active" | "available" | "completed";

type QuestCardProps = {
  quest: BitGalaxyQuest;
  orgId: string;

  // existing props
  variant?: "default" | "carousel";
  status?: QuestStatusBadge;

  // NEW: for player-side routing so the ID persists in the URL
  userId?: string | null;
};

const typeLabels: Record<string, string> = {
  checkin: "Check-in",
  purchase: "Purchase",
  photo: "Photo",
  referral: "Referral",
  visit: "Visit",
  custom: "Quest",
  arcade: "Arcade",
};

function statusPill(status?: QuestStatusBadge) {
  if (status === "completed") {
    return "border-emerald-400/50 bg-emerald-500/10 text-emerald-200";
  }
  if (status === "active") {
    return "border-sky-400/50 bg-sky-500/10 text-sky-200";
  }
  return "border-slate-500/50 bg-slate-900/60 text-slate-200";
}

export function QuestCard({
  quest,
  orgId,
  variant = "default",
  status = "available",
  userId, // NEW
}: QuestCardProps) {
  const typeLabel = typeLabels[quest.type] ?? "Quest";

  const search = new URLSearchParams();
  search.set("orgId", orgId);
  if (userId) {
    search.set("userId", userId);
  }

  const questUrl = `/bitgalaxy/quests/${quest.id}?${search.toString()}`;

  const coverImageUrl =
    (quest as any).coverImageUrl ||
    (quest as any).imageUrl ||
    (quest as any).media?.imageUrl ||
    null;

  return (
    <Link
      href={questUrl}
      className={[
        "group block overflow-hidden rounded-2xl border border-sky-500/40 bg-slate-950/60 hover:border-sky-300/80 hover:bg-slate-900/80 transition-colors",
        variant === "carousel" ? "min-h-[340px]" : "p-4",
      ].join(" ")}
    >
      {/* Screenshot */}
      {variant === "carousel" && (
        <div className="relative">
          {coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImageUrl}
              alt={quest.title}
              className="h-[160px] w-full object-cover"
            />
          ) : (
            <div className="flex h-[160px] items-center justify-center bg-slate-900/50 text-[11px] text-sky-200/70">
              Screenshot not set
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${statusPill(
                status,
              )}`}
            >
              {status}
            </span>
            <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-sky-200">
              {typeLabel}
            </span>
          </div>

          <div className="absolute bottom-3 right-3 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
            +{quest.xp} XP
          </div>
        </div>
      )}

      {/* Body */}
      <div className={variant === "carousel" ? "p-4" : ""}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-sky-100 group-hover:text-sky-200">
              {quest.title}
            </h3>
            <p className="mt-1 line-clamp-3 text-xs text-sky-200/80">
              {quest.description}
            </p>
          </div>

          {variant !== "carousel" && (
            <div className="flex flex-col items-end gap-1">
              <span className="rounded-full border border-sky-400/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-sky-300/90">
                {typeLabel}
              </span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                +{quest.xp} XP
              </span>
            </div>
          )}
        </div>

        {variant === "carousel" && (
          <div className="mt-3 inline-flex items-center gap-2 text-[10px] text-sky-200/70">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
            Tap to open mission briefing
          </div>
        )}
      </div>
    </Link>
  );
}