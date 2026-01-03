import { GalaxyHeader } from "@/components/bitgalaxy/GalaxyHeader";
import { GalaxyPaddleGame } from "@/components/bitgalaxy/GalaxyPaddleGame";
import { PlayerLookupGate } from "@/components/bitgalaxy/PlayerLookupGate";

const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? "neon-lunchbox";

type GalaxyPaddlePageProps = {
  // Matches your other BitGalaxy pages that treat searchParams as a Promise
  searchParams?: Promise<{ orgId?: string; userId?: string }>;
};

export const metadata = {
  title: "BitGalaxy – Galaxy Paddle Tutorial",
};

export default async function GalaxyPaddlePage(
  props: GalaxyPaddlePageProps,
) {
  const resolvedSearch = (await props.searchParams) ?? {};
  const orgId = resolvedSearch.orgId ?? DEFAULT_ORG_ID;
  const userId = resolvedSearch.userId ?? null;

  // No userId in the URL → show the same lookup gate you use on /bitgalaxy
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

  // We have a player ID → launch the game
  return (
    <div className="space-y-6">
      <GalaxyHeader orgName={orgId} />
      <section>
        <GalaxyPaddleGame orgId={orgId} userId={userId} />
      </section>
    </div>
  );
}