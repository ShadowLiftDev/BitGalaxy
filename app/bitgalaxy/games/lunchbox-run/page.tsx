import { GalaxyHeader } from "@/components/bitgalaxy/GalaxyHeader";
import { PlayerLookupGate } from "@/components/bitgalaxy/PlayerLookupGate";
import { LunchboxRunGame } from "@/components/bitgalaxy/LunchboxRunGame";

const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? "neon-lunchbox";

type LunchboxRunPageProps = {
  searchParams?: Promise<{ orgId?: string; userId?: string; guest?: string }>;
};

export const metadata = {
  title: "BitGalaxy – Lunchbox Run",
};

export default async function LunchboxRunPage(props: LunchboxRunPageProps) {
  const resolved =
    (props.searchParams ? await props.searchParams : {}) as {
      orgId?: string;
      userId?: string;
      guest?: string;
    };

  const orgId = (resolved.orgId ?? DEFAULT_ORG_ID).trim();
  const isGuest = resolved.guest === "1";
  const userId = !isGuest && resolved.userId ? resolved.userId : null;

  // Not guest, but no userId → force them through the gate
  if (!isGuest && !userId) {
    return (
      <div className="space-y-6">
        <GalaxyHeader orgName={orgId} />
        <section className="mt-2">
          <PlayerLookupGate
            orgId={orgId}
            redirectBase="/bitgalaxy/games/lunchbox-run"
          />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GalaxyHeader orgName={orgId} />
      <section>
        {/* userId can be null in guest mode */}
        <LunchboxRunGame orgId={orgId} userId={userId} isGuest={isGuest} />
      </section>
    </div>
  );
}