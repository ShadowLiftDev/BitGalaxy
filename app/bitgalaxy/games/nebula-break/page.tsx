import { GalaxyHeader } from "@/components/bitgalaxy/GalaxyHeader";
import { PlayerLookupGate } from "@/components/bitgalaxy/PlayerLookupGate";
import { NebulaBreakGame } from "@/components/bitgalaxy/NebulaBreakGame";

const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? "neon-lunchbox";

type NebulaBreakPageProps = {
  // Align with the Promise-style used elsewhere
  searchParams?: Promise<{ orgId?: string; userId?: string }>;
};

export const metadata = {
  title: "BitGalaxy – Nebula Break Tutorial",
};

export default async function NebulaBreakPage(
  props: NebulaBreakPageProps,
) {
  const resolvedSearch = (await props.searchParams) ?? {};
  const orgId = resolvedSearch.orgId ?? DEFAULT_ORG_ID;
  const userId = resolvedSearch.userId ?? null;

  // No player ID → use the same phone/email lookup as the dashboard
  if (!userId) {
    return (
      <div className="space-y-6">
        <GalaxyHeader orgName={orgId} />
        <section className="mt-2">
          <PlayerLookupGate orgId={orgId} />
        </section>
      </div>
    );
  }

  // Player found → run the game
  return (
    <div className="space-y-6">
      <GalaxyHeader orgName={orgId} />
      <section>
        <NebulaBreakGame orgId={orgId} userId={userId} />
      </section>
    </div>
  );
}