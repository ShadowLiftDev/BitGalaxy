import { adminDb } from "@/lib/firebase-admin";
import {
  BitGalaxySettingsForm,
  type BitGalaxySettingsInitial,
} from "@/components/bitgalaxy/admin/BitGalaxySettingsForm";

type OrgParams = { orgId: string };

type BitGalaxySettingsPageProps = {
  params: Promise<OrgParams>;
};

export const metadata = {
  title: "BitGalaxy – Settings",
};

async function getSettings(orgId: string): Promise<BitGalaxySettingsInitial> {
  const ref = adminDb
    .collection("orgs")
    .doc(orgId)
    .collection("bitgalaxyConfig")
    .doc("config");

  const snap = await ref.get();
  const data = (snap.exists ? (snap.data() as any) : {}) || {};

  return {
    enabled: data.enabled ?? false,
    theme: data.theme ?? "neon",
    xpPerCheckin: Number(data.xpPerCheckin ?? 0),
    defaultProgramId: data.defaultProgramId ?? null,
  };
}

export default async function BitGalaxySettingsPage({
  params,
}: BitGalaxySettingsPageProps) {
  // ✅ unwrap params Promise
  const { orgId } = await params;
  const decodedOrgId = decodeURIComponent(orgId);

  const initial = await getSettings(decodedOrgId);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/70 bg-sky-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-sky-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.95)]" />
            World Engine Config
          </div>
          <h2 className="mt-2 text-sm font-semibold text-sky-50">
            BitGalaxy Settings
          </h2>
          <p className="text-xs text-sky-100/85">
            Enable or disable BitGalaxy for this org, tune XP defaults, and
            assign a default program/season for new players and check-ins.
          </p>
        </div>

        <div className="rounded-xl border border-sky-500/40 bg-slate-950/80 px-3 py-2 text-[11px] text-sky-200">
          <div className="font-mono text-[10px] text-sky-300/80">
            orgs/neon-lunchbox/bitgalaxyConfig/config
          </div>
          <div className="mt-1 text-[10px] text-sky-300/80">
            Read by check-ins, XP engine, and quests.
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-sky-500/40 bg-slate-950/90 p-4 shadow-[0_0_36px_rgba(56,189,248,0.4)]">
        <BitGalaxySettingsForm orgId={decodedOrgId} initial={initial} />
      </section>
    </div>
  );
}