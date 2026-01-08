const REFERRALINK_URL =
  process.env.NEXT_PUBLIC_REFERRALINK_APP_URL ??
  "https://www.referralink.app";
const REWARDCIRCLE_URL =
  process.env.NEXT_PUBLIC_REWARDCIRCLE_APP_URL ??
  "https://www.rewardcircle.app";
const DIRECTORY_URL =
  process.env.NEXT_PUBLIC_DIRECTORY_APP_URL ?? "https://www.directory.app";

type OrgParams = { orgId: string };

type BitGalaxyIntegrationsPageProps = {
  params: Promise<OrgParams>;
};

export const metadata = {
  title: "BitGalaxy – Integrations",
};

export default async function BitGalaxyIntegrationsPage({
  params,
}: BitGalaxyIntegrationsPageProps) {
  const { orgId } = await params;
  const decodedOrgId = decodeURIComponent(orgId);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
          Integration Matrix
        </div>
        <h2 className="text-sm font-semibold text-emerald-50">
          Cross-App Wiring for BitGalaxy
        </h2>
        <p className="text-xs text-emerald-100/85">
          See how this world&apos;s XP engine connects with Referralink,
          RewardCircle, and Directory. NeonHQ + ProfileMatrix sit above this as
          the orchestration layer.
        </p>
      </header>

      <section className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-slate-950/85 p-5 text-xs text-emerald-50 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
        {/* holo wash */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-35 mix-blend-screen [background-image:radial-gradient(circle_at_top,_rgba(16,185,129,0.3)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.25)_0,_transparent_55%)]"
        />

        <div className="relative space-y-3">
          {/* Referralink */}
          <div className="rounded-xl border border-emerald-500/35 bg-slate-950/95 p-3 shadow-[0_0_18px_rgba(15,23,42,0.9)]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-semibold text-emerald-100">
                  Referralink
                </div>
                <p className="mt-1 text-[11px] text-emerald-200/85">
                  Referral completions can fire BitGalaxy events, awarding XP or
                  inventory items per successful invite.
                </p>
              </div>
              <span className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-200">
                XP INPUT
              </span>
            </div>
            <p className="mt-2 text-[11px] text-emerald-300/85">
              App URL:{" "}
              <a
                href={REFERRALINK_URL}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-emerald-500/70 underline-offset-2 hover:text-emerald-100"
              >
                {REFERRALINK_URL}
              </a>
            </p>
          </div>

          {/* RewardCircle */}
          <div className="rounded-xl border border-emerald-500/35 bg-slate-950/95 p-3 shadow-[0_0_18px_rgba(15,23,42,0.9)]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-semibold text-emerald-100">
                  RewardCircle
                </div>
                <p className="mt-1 text-[11px] text-emerald-200/85">
                  BitGalaxy XP + inventory items can unlock RewardCircle rewards
                  via your configured XP → reward map.
                </p>
              </div>
              <span className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-200">
                REWARD OUTPUT
              </span>
            </div>
            <p className="mt-2 text-[11px] text-emerald-300/85">
              App URL:{" "}
              <a
                href={REWARDCIRCLE_URL}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-emerald-500/70 underline-offset-2 hover:text-emerald-100"
              >
                {REWARDCIRCLE_URL}
              </a>
            </p>
          </div>

          {/* Directory */}
          <div className="rounded-xl border border-emerald-500/35 bg-slate-950/95 p-3 shadow-[0_0_18px_rgba(15,23,42,0.9)]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-semibold text-emerald-100">
                  Directory
                </div>
                <p className="mt-1 text-[11px] text-emerald-200/85">
                  Player UIDs can be associated with Directory profiles to see
                  engagement context and XP history alongside member data.
                </p>
              </div>
              <span className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-200">
                ID LAYER
              </span>
            </div>
            <p className="mt-2 text-[11px] text-emerald-300/85">
              App URL:{" "}
              <a
                href={DIRECTORY_URL}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-emerald-500/70 underline-offset-2 hover:text-emerald-100"
              >
                {DIRECTORY_URL}
              </a>
            </p>
          </div>

          <p className="pt-2 text-[11px] text-emerald-200/80">
            This screen is the wiring diagram. Actual toggles and per-app config
            can be stored under{" "}
            <span className="font-mono">
              orgs/neon-lunchbox/integrations
            </span>{" "}
            and surfaced here once NeonHQ exposes a unified integration schema.
            ProfileMatrix then becomes the place where all these signals are
            viewed as one timeline per member.
          </p>
        </div>
      </section>
    </div>
  );
}