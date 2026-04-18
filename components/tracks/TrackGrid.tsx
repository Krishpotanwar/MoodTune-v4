import type { Track } from "@/lib/schema";
import { TrackCard } from "@/components/tracks/TrackCard";

export function TrackGrid({
  tracks,
  query,
}: {
  tracks: Track[];
  query?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {tracks.map((track) => (
        <TrackCard key={track.id} track={track} query={query} />
      ))}
    </div>
  );
}
