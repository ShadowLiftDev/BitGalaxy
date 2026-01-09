"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const QUEST_TYPES = [
  "checkin",
  "purchase",
  "photo",
  "referral",
  "visit",
  "custom",
] as const;

type QuestType = (typeof QUEST_TYPES)[number];

export type QuestFormMode = "create" | "edit";

export interface QuestFormProps {
  orgId: string;
  mode: QuestFormMode;
  questId?: string;
  initialData?: {
    title?: string;
    description?: string;
    programId?: string | null;
    type?: QuestType;
    xp?: number;
    isActive?: boolean;
    maxCompletionsPerUser?: number | null;
    checkinCode?: string | null;
    requiresStaffApproval?: boolean;
    metadata?: Record<string, any> | null;

    // NEW – for loyalty config
    loyaltyReward?: {
      enabled?: boolean;
      pointsPerCompletion?: number;
    } | null;
  };
}

export function QuestForm({
  orgId,
  mode,
  questId,
  initialData,
}: QuestFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [programId, setProgramId] = useState(
    initialData?.programId ?? "",
  );
  const [type, setType] = useState<QuestType>(
    (initialData?.type as QuestType) ?? "checkin",
  );
  const [xp, setXp] = useState(
    typeof initialData?.xp === "number" ? initialData.xp : 10,
  );
  const [isActive, setIsActive] = useState(
    initialData?.isActive ?? true,
  );
  const [maxCompletionsPerUser, setMaxCompletionsPerUser] = useState<
    string
  >(
    initialData?.maxCompletionsPerUser != null
      ? String(initialData.maxCompletionsPerUser)
      : "",
  );
  const [checkinCode, setCheckinCode] = useState(
    initialData?.checkinCode ?? "",
  );
  const [requiresStaffApproval, setRequiresStaffApproval] = useState(
    initialData?.requiresStaffApproval ?? false,
  );
  const [metadataJson, setMetadataJson] = useState(
    initialData?.metadata ? JSON.stringify(initialData.metadata, null, 2) : "",
  );
    const [loyaltyEnabled, setLoyaltyEnabled] = useState(
    initialData?.loyaltyReward?.enabled ?? false,
  );
  const [loyaltyPoints, setLoyaltyPoints] = useState(
    typeof initialData?.loyaltyReward?.pointsPerCompletion === "number"
      ? initialData.loyaltyReward.pointsPerCompletion
      : 0,
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    const xpValue = Number(xp);
    if (Number.isNaN(xpValue) || xpValue < 0) {
      setError("XP must be a non-negative number");
      return;
    }

    // NEW – loyalty validation
    let loyaltyPointsValue = 0;
    if (loyaltyEnabled) {
      loyaltyPointsValue = Number(loyaltyPoints);
      if (Number.isNaN(loyaltyPointsValue) || loyaltyPointsValue < 0) {
        setError("Loyalty points must be a non-negative number");
        return;
      }
    }

    let maxCompletions: number | null = null;
    if (maxCompletionsPerUser.trim() !== "") {
      const parsed = Number(maxCompletionsPerUser);
      if (Number.isNaN(parsed) || parsed < 0) {
        setError("Max completions per user must be a non-negative number");
        return;
      }
      maxCompletions = parsed;
    }

    let metadata: Record<string, any> | undefined;
    if (metadataJson.trim() !== "") {
      try {
        metadata = JSON.parse(metadataJson);
      } catch (err) {
        setError("Metadata must be valid JSON");
        return;
      }
    }

    setSaving(true);
    try {
      const url =
        mode === "create"
          ? `/api/hq/${encodeURIComponent(orgId)}/bitgalaxy/quests/create`
          : `/api/hq/${encodeURIComponent(orgId)}/bitgalaxy/quests/update`;

      const body: any = {
        title: title.trim(),
        description: description.trim(),
        programId: programId.trim() || null,
        type,
        xp: xpValue,
        isActive,
        maxCompletionsPerUser: maxCompletions,
        checkinCode: checkinCode.trim() || null,
        requiresStaffApproval,
        metadata: metadata ?? null,

        // NEW – loyalty config we send to the API
        loyaltyReward:
          loyaltyEnabled && loyaltyPointsValue > 0
            ? {
                enabled: true,
                pointsPerCompletion: loyaltyPointsValue,
              }
            : {
                enabled: false,
                pointsPerCompletion: 0,
              },
      };

      if (mode === "edit") {
        body.questId = questId;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save quest");
      }

      setSuccess(
        mode === "create"
          ? "Quest created successfully"
          : "Quest updated successfully",
      );

      // Send back to quests list after a short delay
      setTimeout(() => {
        router.push(`/hq/${encodeURIComponent(orgId)}/bitgalaxy/quests`);
        router.refresh();
      }, 600);
    } catch (err: any) {
      console.error("Quest save failed:", err);
      setError(err?.message ?? "Failed to save quest");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-sky-500/40 bg-slate-950/80 p-5 text-xs text-sky-100"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-sky-100">
            {mode === "create" ? "Create Quest" : "Edit Quest"}
          </h2>
          <p className="mt-1 text-[11px] text-sky-300/80">
            Define how players earn XP and progress in this world.
          </p>
        </div>
      </div>

      {/* Title + XP + Active */}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-1">
          <label className="text-[11px] text-sky-300/90">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-sky-500/40 bg-slate-950/80 px-3 py-2 text-xs text-sky-50 outline-none placeholder:text-sky-400/50 focus:border-sky-300"
            placeholder="Example: First Check-in of the Day"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] text-sky-300/90">XP Reward</label>
          <input
            type="number"
            min={0}
            value={xp}
            onChange={(e) => setXp(Number(e.target.value))}
            className="w-full rounded-lg border border-sky-500/40 bg-slate-950/80 px-3 py-2 text-xs text-sky-50 outline-none focus:border-sky-300"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] text-sky-300/90">Status</label>
          <select
            value={isActive ? "active" : "inactive"}
            onChange={(e) => setIsActive(e.target.value === "active")}
            className="w-full rounded-lg border border-sky-500/40 bg-slate-950/80 px-3 py-2 text-xs text-sky-50 outline-none focus:border-sky-300"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-[11px] text-sky-300/90">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-sky-500/40 bg-slate-950/80 px-3 py-2 text-xs text-sky-50 outline-none placeholder:text-sky-400/50 focus:border-sky-300"
          placeholder="Explain what the player needs to do to complete this quest."
        />
      </div>

      {/* Type + Program + Max completions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-[11px] text-sky-300/90">Quest Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as QuestType)}
            className="w-full rounded-lg border border-sky-500/40 bg-slate-950/80 px-3 py-2 text-xs text-sky-50 outline-none focus:border-sky-300"
          >
            {QUEST_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] text-sky-300/90">
            Program / Season (optional)
          </label>
          <input
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="w-full rounded-lg border border-sky-500/40 bg-slate-950/80 px-3 py-2 text-xs text-sky-50 outline-none placeholder:text-sky-400/50 focus:border-sky-300"
            placeholder="program id or leave blank"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] text-sky-300/90">
            Max completions per user
          </label>
          <input
            value={maxCompletionsPerUser}
            onChange={(e) => setMaxCompletionsPerUser(e.target.value)}
            placeholder="1 for one-time, blank for infinite"
            className="w-full rounded-lg border border-sky-500/40 bg-slate-950/80 px-3 py-2 text-xs text-sky-50 outline-none placeholder:text-sky-400/50 focus:border-sky-300"
          />
        </div>
      </div>

      {/* Loyalty Points Config */}
      <div className="mt-2 rounded-xl border border-emerald-500/40 bg-emerald-950/10 p-3 space-y-2">
        <label className="flex items-center gap-2 text-[11px] text-emerald-200">
          <input
            type="checkbox"
            checked={loyaltyEnabled}
            onChange={(e) => setLoyaltyEnabled(e.target.checked)}
            className="h-3 w-3 accent-emerald-500"
          />
          <span>
            Also grant{" "}
            <span className="font-semibold">loyalty points</span> when this
            quest is completed
          </span>
        </label>

        {loyaltyEnabled && (
          <div className="space-y-1">
            <label className="text-[11px] text-emerald-200/90">
              Loyalty points per completion
            </label>
            <input
              type="number"
              min={0}
              value={loyaltyPoints}
              onChange={(e) => setLoyaltyPoints(Number(e.target.value))}
              className="w-full rounded-lg border border-emerald-500/40 bg-slate-950/80 px-3 py-2 text-xs text-emerald-50 outline-none focus:border-emerald-300"
            />
            <p className="mt-1 text-[10px] text-emerald-200/80">
              These points will be added to the member&apos;s RewardCircle
              balance whenever this quest reward is granted.
            </p>
          </div>
        )}
      </div>

      {/* Check-in code + staff approval */}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-1">
          <label className="text-[11px] text-sky-300/90">
            Check-in Code (for QR / manual entry)
          </label>
          <input
            value={checkinCode}
            onChange={(e) => setCheckinCode(e.target.value)}
            placeholder="Only used for checkin-type quests"
            className="w-full rounded-lg border border-sky-500/40 bg-slate-950/80 px-3 py-2 text-xs text-sky-50 outline-none placeholder:text-sky-400/50 focus:border-sky-300"
          />
        </div>

        <label className="mt-5 flex items-center gap-2 text-[11px] text-sky-200">
          <input
            type="checkbox"
            checked={requiresStaffApproval}
            onChange={(e) => setRequiresStaffApproval(e.target.checked)}
            className="h-3 w-3 accent-sky-500"
          />
          Requires staff approval
        </label>
      </div>

      {/* Metadata JSON */}
      <div className="space-y-1">
        <label className="text-[11px] text-sky-300/90">
          Metadata (optional JSON)
        </label>
        <textarea
          value={metadataJson}
          onChange={(e) => setMetadataJson(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-sky-500/40 bg-slate-950/80 px-3 py-2 font-mono text-[11px] text-sky-50 outline-none placeholder:text-sky-400/50 focus:border-sky-300"
          placeholder='e.g. { "minSpend": 20, "category": "brunch" }'
        />
        <p className="mt-1 text-[10px] text-sky-400/80">
          Metadata can hold extra conditions like minimum spend, specific menu
          items, or promo tags.
        </p>
      </div>

      {/* Messages + actions */}
      {error && (
        <p className="text-[11px] text-red-300">
          {error}
        </p>
      )}
      {success && (
        <p className="text-[11px] text-emerald-300">
          {success}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            router.push(
              `/hq/${encodeURIComponent(orgId)}/bitgalaxy/quests`,
            );
          }}
          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-[11px] font-semibold text-sky-200 hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-sky-500 px-4 py-2 text-[11px] font-semibold text-slate-950 shadow-sm hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
            ? "Create quest"
            : "Save changes"}
        </button>
      </div>
    </form>
  );
}

export default QuestForm;