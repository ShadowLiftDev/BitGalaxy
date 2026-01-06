import { GalaxyHeader } from "@/components/bitgalaxy/GalaxyHeader";
import { GalaxyPaddleGame } from "@/components/bitgalaxy/GalaxyPaddleGame";
import { PlayerLookupGate } from "@/components/bitgalaxy/PlayerLookupGate";

const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? "neon-lunchbox";

type GalaxyPaddlePageProps = {
  searchParams?: Promise<{ orgId?: string; userId?: string; guest?: string }>;
};

export const metadata = {
  title: "BitGalaxy – Galaxy Paddle",
};

export default async function GalaxyPaddlePage(props: GalaxyPaddlePageProps) {
  const resolvedSearch = props.searchParams ? await props.searchParams : {};
  const orgId = (resolvedSearch.orgId ?? DEFAULT_ORG_ID).trim();
  const userId = resolvedSearch.userId ?? null;

  // If no userId → show gate that redirects BACK to this game route
  if (!userId) {
    return (
      <div className="space-y-6">
        <GalaxyHeader orgName={orgId} />
        <section className="mt-2">
          <PlayerLookupGate orgId={orgId} redirectBase="/bitgalaxy/games/galaxy-paddle" />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GalaxyHeader orgName={orgId} />
      <section>
        <GalaxyPaddleGame orgId={orgId} userId={userId} />
      </section>
    </div>
  );
}