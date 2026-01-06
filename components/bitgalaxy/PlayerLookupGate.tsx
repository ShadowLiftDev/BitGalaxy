"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type PlayerLookupGateProps = {
  orgId: string;

  /**
   * Where to send the user once we have a userId.
   * Example: "/bitgalaxy" or "/bitgalaxy/games"
   */
  redirectBase?: string;

  /**
   * If lookup fails (player not found), show a CTA link to create the profile elsewhere.
   * Can be external (https://...) or internal (/hq/...)
   */
  joinRedirectUrl?: string;

  /**
   * Optional: label for the CTA when player not found.
   */
  joinCtaLabel?: string;
};

type LookupMode = "email" | "phone";

function withParams(
  path: string,
  params: Record<string, string | undefined | null>,
) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}

function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

export function PlayerLookupGate({
  orgId,
  redirectBase = "/bitgalaxy",
  joinRedirectUrl,
  joinCtaLabel = "Create my BitGalaxy profile",
}: PlayerLookupGateProps) {
  const router = useRouter();

  const [mode, setMode] = useState<LookupMode>("phone");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When lookup returns "not found", we show link-only CTA (no join form)
  const [notFound, setNotFound] = useState(false);

  async function handleLookupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotFound(false);

    const payload: { orgId: string; email?: string; phone?: string } = { orgId };

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
        // ✅ Always carry orgId + userId forward
        router.push(
          withParams(redirectBase, {
            orgId,
            userId: String(json.userId),
          }),
        );
        return;
      }

      // If not found: show CTA link only
      if (res.status === 404 || json.code === "PLAYER_NOT_FOUND") {
        setNotFound(true);
        return;
      }

      throw new Error(json.error || "We couldn’t find a player with that info.");
    } catch (err: any) {
      console.error("Player lookup failed:", err);
      setError(err?.message ?? "We couldn’t find a player with that info.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-sky-500/50 bg-slate-950/85 p-5 shadow-[0_0_36px_rgba(56,189,248,0.5)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen [background-image:radial-gradient(circle_at_top,_rgba(56,189,248,0.3)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.22)_0,_transparent_55%)]"
      />

      <div className="relative space-y-4 text-xs text-sky-100">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/50 bg-sky-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-sky-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
            Player Access Gate
          </div>
          <h1 className="mt-2 text-base font-semibold text-sky-50">
            Find your BitGalaxy profile
          </h1>
          <p className="text-[11px] text-sky-200/85">
            Use the email or phone number you shared with staff when earning XP.
            This pulls the correct player from this world.
          </p>
        </div>

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
            </div>
          )}

          {error && <p className="text-[11px] text-rose-300">{error}</p>}

          {notFound && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
              <p className="text-[11px] text-amber-100">
                We couldn’t find a player with that info.
              </p>
              <p className="mt-1 text-[10px] text-amber-200/80">
                Create your BitGalaxy profile using the official link below.
              </p>

              {joinRedirectUrl ? (
                isExternalUrl(joinRedirectUrl) ? (
                  <a
                    href={joinRedirectUrl}
                    className="mt-3 inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-[11px] font-semibold text-slate-950 shadow-[0_0_24px_rgba(251,191,36,0.55)] transition hover:bg-amber-300"
                  >
                    {joinCtaLabel}
                  </a>
                ) : (
                  <Link
                    href={joinRedirectUrl}
                    className="mt-3 inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-[11px] font-semibold text-slate-950 shadow-[0_0_24px_rgba(251,191,36,0.55)] transition hover:bg-amber-300"
                  >
                    {joinCtaLabel}
                  </Link>
                )
              ) : (
                <p className="mt-2 text-[10px] text-amber-200/80">
                  (No join link configured.)
                </p>
              )}
            </div>
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
      </div>
    </section>
  );
}