import { GalaxyHeader } from "@/components/bitgalaxy/GalaxyHeader";
import { PlayerLookupGate } from "@/components/bitgalaxy/PlayerLookupGate";
import { NeonMemoryGame } from "@/components/bitgalaxy/NeonMemoryGame";

const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? "neon-lunchbox";

type NeonMemoryPageProps = {
  searchParams?: Promise<{ orgId?: string; userId?: string; guest?: string }>;
};

export const metadata = {
  title: "BitGalaxy – Neon Memory",
};

export default async function NeonMemoryPage(props: NeonMemoryPageProps) {
  const resolvedSearch = props.searchParams ? await props.searchParams : {};
  const orgId = (resolvedSearch.orgId ?? DEFAULT_ORG_ID).trim();
  const userId = resolvedSearch.userId ?? null;

  if (!userId) {
    return (
      <div className="space-y-6">
        <GalaxyHeader orgName={orgId} />
        <section className="mt-2">
          <PlayerLookupGate orgId={orgId} redirectBase="/bitgalaxy/games/neon-memory" />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GalaxyHeader orgName={orgId} />
      <section>
        <NeonMemoryGame orgId={orgId} userId={userId} />
      </section>
    </div>
  );
}