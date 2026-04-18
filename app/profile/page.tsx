import { headers } from "next/headers";
import { TasteProfileCard } from "@/components/profile/TasteProfileCard";
import { ensureSession, getSessionIdFromHeaders } from "@/lib/session";
import { createSupabaseSessionClient } from "@/lib/supabase";

async function loadProfileData(sessionId: string) {
  const sessionClient = createSupabaseSessionClient(sessionId);
  const [{ data: profile, error: profileError }, { data: feedbackRows, error: feedbackError }] =
    await Promise.all([
      sessionClient
        .from("taste_profiles")
        .select("summary, rating_count, updated_at")
        .maybeSingle(),
      sessionClient
        .from("feedback")
        .select("track_id, rating, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  if (profileError) {
    throw profileError;
  }

  if (feedbackError) {
    throw feedbackError;
  }

  const trackIds = [...new Set((feedbackRows ?? []).map((row) => row.track_id))];
  const { data: tracks, error: trackError } = trackIds.length
    ? await sessionClient
        .from("tracks")
        .select("id, name, artist")
        .in("id", trackIds)
    : { data: [], error: null };

  if (trackError) {
    throw trackError;
  }

  const trackMap = new Map((tracks ?? []).map((track) => [track.id, track]));
  const history = (feedbackRows ?? [])
    .map((row) => {
      const track = trackMap.get(row.track_id);

      if (!track) {
        return null;
      }

      return {
        track_id: row.track_id,
        rating: row.rating,
        created_at: row.created_at,
        track_name: track.name,
        artist: track.artist,
      };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null);

  return {
    profile,
    history,
  };
}

export default async function ProfilePage() {
  const requestHeaders = await headers();
  const sessionId = getSessionIdFromHeaders(requestHeaders);

  if (!sessionId) {
    return null;
  }

  await ensureSession(sessionId);
  const { profile, history } = await loadProfileData(sessionId);

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.1),_transparent_25%),linear-gradient(180deg,_rgba(255,255,255,0.03),_transparent_18%)]" />
      <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <TasteProfileCard
          initialSummary={profile?.summary ?? null}
          ratingCount={profile?.rating_count ?? history.length}
          updatedAt={profile?.updated_at ?? null}
          history={history}
        />
      </section>
    </main>
  );
}
