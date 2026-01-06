import { GalaxyHeader } from "@/components/bitgalaxy/GalaxyHeader";
import { PlayerLookupGate } from "@/components/bitgalaxy/PlayerLookupGate";
import { NebulaBreakGame } from "@/components/bitgalaxy/NebulaBreakGame";

const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? "neon-lunchbox";

type NebulaBreakPageProps = {
  searchParams?: Promise<{ orgId?: string; userId?: string; guest?: string }>;
};

export const metadata = {
  title: "BitGalaxy – Nebula Break",
};

export default async function NebulaBreakPage(props: NebulaBreakPageProps) {
  const resolvedSearch = props.searchParams ? await props.searchParams : {};
  const orgId = (resolvedSearch.orgId ?? DEFAULT_ORG_ID).trim();
  const userId = resolvedSearch.userId ?? null;

  if (!userId) {
    return (
      <div className="space-y-6">
        <GalaxyHeader orgName={orgId} />
        <section className="mt-2">
          <PlayerLookupGate orgId={orgId} redirectBase="/bitgalaxy/games/nebula-break" />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GalaxyHeader orgName={orgId} />
      <section>
        <NebulaBreakGame orgId={orgId} userId={userId} />
      </section>
    </div>
  );
}