import { GalaxyHeader } from "@/components/bitgalaxy/GalaxyHeader";
import { PlayerLookupGate } from "@/components/bitgalaxy/PlayerLookupGate";
import { NeonMemoryGame } from "@/components/bitgalaxy/NeonMemoryGame";
import { getServerUser } from "@/lib/auth-server";

const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? "neon-lunchbox";

type NeonMemoryPageProps = {
  searchParams?: { userId?: string };
};

export const metadata = {
  title: "BitGalaxy – Neon Memory Tutorial",
};

export default async function NeonMemoryPage({
  searchParams,
}: NeonMemoryPageProps) {
  const orgId = DEFAULT_ORG_ID;

  // Priority:
  // 1) explicit ?userId= from the URL
  // 2) authenticated user from Firebase
  // 3) fall back to PlayerLookupGate if neither
  let userId = searchParams?.userId || null;

  if (!userId) {
    const user = await getServerUser();
    if (user) {
      userId = user.uid;
    }
  }

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

  return (
    <div className="space-y-6">
      <GalaxyHeader orgName={orgId} />
      <section>
        <NeonMemoryGame orgId={orgId} userId={userId} />
      </section>
    </div>
  );
}