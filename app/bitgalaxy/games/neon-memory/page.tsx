import { GalaxyHeader } from "@/components/bitgalaxy/GalaxyHeader";
import { PlayerLookupGate } from "@/components/bitgalaxy/PlayerLookupGate";
import { NeonMemoryGame } from "@/components/bitgalaxy/NeonMemoryGame";

const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? "neon-lunchbox";

type NeonMemoryPageProps = {
  // Same Promise-style searchParams for consistency
  searchParams?: Promise<{ orgId?: string; userId?: string }>;
};

export const metadata = {
  title: "BitGalaxy – Neon Memory Tutorial",
};

export default async function NeonMemoryPage(
  props: NeonMemoryPageProps,
) {
  const resolvedSearch = (await props.searchParams) ?? {};
  const orgId = resolvedSearch.orgId ?? DEFAULT_ORG_ID;
  const userId = resolvedSearch.userId ?? null;

  // No player ID → route through the phone/email gate instead of auth
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

  // Player present → launch Neon Memory
  return (
    <div className="space-y-6">
      <GalaxyHeader orgName={orgId} />
      <section>
        <NeonMemoryGame orgId={orgId} userId={userId} />
      </section>
    </div>
  );
}