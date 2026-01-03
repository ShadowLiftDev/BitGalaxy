"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PlayerLookupGateProps = {
  orgId: string;
  /**
   * Where to send the user once we have a userId.
   * Defaults to "/bitgalaxy" (the main player dashboard).
   *
   * Examples:
   *   - "/bitgalaxy"             → /bitgalaxy?userId=XYZ
   *   - "/bitgalaxy/games"       → /bitgalaxy/games?userId=XYZ
   *   - "/bitgalaxy/tutorial"    → /bitgalaxy/tutorial?userId=XYZ
   */
  redirectBase?: string;
};

type LookupMode = "email" | "phone";

export function PlayerLookupGate({
  orgId,
  redirectBase = "/bitgalaxy",
}: PlayerLookupGateProps) {
  const router = useRouter();

  const [mode, setMode] = useState<LookupMode>("phone");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(
    "Use the same email or phone number you gave the venue when you earned XP.",
  );

  // 👉 Join state (shown when we can’t find a player)
  const [joinMode, setJoinMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  async function handleLookupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setHint(null);
    setJoinMode(false);

    const payload: { orgId: string; email?: string; phone?: string } = {
      orgId,
    };

    if (mode === "email") {
      const value = email.trim();
      if (!value) {
        setError("Enter the email you used at the venue.");
        return;
      }
      payload.email = value.toLowerCase();
    } else {
      const value = phone.trim();
      if (!value) {
        setError("Enter the phone number linked to your account.");
        return;
      }
      payload.phone = value;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bitgalaxy/lookup-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success && json.userId) {
        // ✅ Found player → redirect to wherever this gate is configured for
        router.push(
          `${redirectBase}?userId=${encodeURIComponent(
            json.userId as string,
          )}`,
        );
        return;
      }

      // If the API uses 404 for not-found, treat that as "new player" path
      if (res.status === 404 || json.code === "PLAYER_NOT_FOUND") {
        setJoinMode(true);
        setHint(
          "We couldn’t find a player with that info. You can create a BitGalaxy profile below to start earning XP.",
        );
      } else {
        throw new Error(
          json.error || "We couldn’t find a player with that info.",
        );
      }
    } catch (err: any) {
      console.error("Player lookup failed:", err);
      setError(err?.message ?? "We couldn’t find a player with that info.");
      setHint(
        "Make sure you’re using the same email/phone you gave staff when you checked in or earned XP.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedFirst || !trimmedLast) {
      setError("First and last name are required to create a profile.");
      return;
    }
    if (!trimmedEmail && !trimmedPhone) {
      setError("Provide at least a phone or email so we can find you later.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bitgalaxy/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          firstName: trimmedFirst,
          lastName: trimmedLast,
          email: trimmedEmail || undefined,
          phone: trimmedPhone || undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.success || !json.userId) {
        throw new Error(json.error || "Failed to create player profile.");
      }

      // 🚀 New player created → send them to the configured destination
      router.push(
        `${redirectBase}?userId=${encodeURIComponent(
          json.userId as string,
        )}`,
      );
    } catch (err: any) {
      console.error("Player join failed:", err);
      setError(err?.message ?? "Failed to create player profile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-sky-500/50 bg-slate-950/85 p-5 shadow-[0_0_36px_rgba(56,189,248,0.5)]">
      {/* glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen [background-image:radial-gradient(circle_at_top,_rgba(56,189,248,0.3)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.22)_0,_transparent_55%)]"
      />

      <div className="relative space-y-4 text-xs text-sky-100">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/50 bg-sky-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-sky-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
              Player Access Gate
            </div>
            <h1 className="mt-2 text-base font-semibold text-sky-50">
              {joinMode
                ? "Create your BitGalaxy profile"
                : "Find your BitGalaxy profile"}
            </h1>
            <p className="text-[11px] text-sky-200/85">
              {joinMode
                ? "Lock in your ID so XP, quests, and arcade scores can follow you across this world."
                : "Use the email or phone number you shared with staff when earning XP. This helps us pull the correct player from this world."}
            </p>
          </div>
        </div>

        {/* mode toggle – only relevant for lookup step */}
        {!joinMode && (
          <div className="inline-flex rounded-full border border-sky-500/40 bg-slate-950/80 p-1 text-[11px] text-sky-200">
            <button
              type="button"
              onClick={() => setMode("phone")}
              className={
                "rounded-full px-3 py-1.5 transition " +
                (mode === "phone"
                  ? "bg-sky-500 text-slate-950 shadow-[0_0_18px_rgba(56,189,248,0.6)]"
                  : "text-sky-300 hover:bg-slate-900")
              }
            >
              Phone
            </button>
            <button
              type="button"
              onClick={() => setMode("email")}
              className={
                "rounded-full px-3 py-1.5 transition " +
                (mode === "email"
                  ? "bg-sky-500 text-slate-950 shadow-[0_0_18px_rgba(56,189,248,0.6)]"
                  : "text-sky-300 hover:bg-slate-900")
              }
            >
              Email
            </button>
          </div>
        )}

        {/* STEP 1: lookup form */}
        {!joinMode && (
          <form
            onSubmit={handleLookupSubmit}
            className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-950/90 p-4"
          >
            {mode === "email" ? (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-sky-200">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-sky-500/40 bg-slate-950/80 px-3 py-2 text-xs text-sky-50 outline-none placeholder:text-sky-400/60 focus:border-sky-300"
                />
                <p className="text-[10px] text-sky-400/80">
                  Use the same email you used when you first checked in or joined
                  the loyalty list at this venue.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-sky-200">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full rounded-lg border border-sky-500/40 bg-slate-950/80 px-3 py-2 text-xs text-sky-50 outline-none placeholder:text-sky-400/60 focus:border-sky-300"
                />
                <p className="text-[10px] text-sky-400/80">
                  Use the phone number staff enter when looking you up in
                  RewardCircle or BitGalaxy.
                </p>
              </div>
            )}

            {error && (
              <p className="text-[11px] text-rose-300">
                {error}
              </p>
            )}
            {hint && !error && (
              <p className="text-[10px] text-sky-300/80">
                {hint}
              </p>
            )}

            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-sky-500 px-4 py-2 text-[11px] font-semibold text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.7)] transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Locating player…" : "Locate my profile"}
              </button>

              <p className="text-[10px] text-sky-400/80">
                Linked world: <span className="font-mono">orgs/{orgId}</span>
              </p>
            </div>
          </form>
        )}

        {/* STEP 2: join form */}
        {joinMode && (
          <form
            onSubmit={handleJoinSubmit}
            className="space-y-3 rounded-xl border border-emerald-500/40 bg-slate-950/95 p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-emerald-200">
                  First name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-emerald-500/40 bg-slate-950/80 px-3 py-2 text-xs text-emerald-50 outline-none placeholder:text-emerald-400/60 focus:border-emerald-300"
                  placeholder="Jordan"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-emerald-200">
                  Last name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-emerald-500/40 bg-slate-950/80 px-3 py-2 text-xs text-emerald-50 outline-none placeholder:text-emerald-400/60 focus:border-emerald-300"
                  placeholder="Knight"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-emerald-200">
                Phone number{" "}
                <span className="text-emerald-400/70">(recommended)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-emerald-500/40 bg-slate-950/80 px-3 py-2 text-xs text-emerald-50 outline-none placeholder:text-emerald-400/60 focus:border-emerald-300"
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-emerald-200">
                Email address{" "}
                <span className="text-emerald-400/70">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-emerald-500/40 bg-slate-950/80 px-3 py-2 text-xs text-emerald-50 outline-none placeholder:text-emerald-400/60 focus:border-emerald-300"
                placeholder="you@example.com"
              />
              <p className="text-[10px] text-emerald-300/80">
                Phone or email is required so staff can find you later. You can add
                the other in Player Settings at any time.
              </p>
            </div>

            {error && (
              <p className="text-[11px] text-rose-300">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-emerald-500 px-4 py-2 text-[11px] font-semibold text-slate-950 shadow-[0_0_24px_rgba(16,185,129,0.7)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating profile…" : "Create my BitGalaxy profile"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setJoinMode(false);
                  setError(null);
                  setHint(
                    "Use the same email or phone number you gave the venue when you earned XP.",
                  );
                }}
                className="text-[10px] text-sky-300/85 underline-offset-2 hover:underline"
              >
                Already have an ID? Go back to lookup.
              </button>
            </div>
          </form>
        )}

        {!joinMode && (
          <p className="text-[10px] text-sky-400/80">
            Once we find your player ID, we’ll load your full mission dashboard
            for this world — XP, quests, inventory, and more.
          </p>
        )}
        {joinMode && (
          <p className="text-[10px] text-emerald-300/80">
            Your ID is tied to this world only. When we bring more worlds
            online, you’ll be able to sync your profile across the Neon
            Ecosystem.
          </p>
        )}
      </div>
    </section>
  );
}