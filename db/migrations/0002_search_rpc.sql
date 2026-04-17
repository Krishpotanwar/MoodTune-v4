create or replace function match_tracks(
  query_embedding vector(384),
  match_count int default 20
)
returns table (
  id text,
  name text,
  artist text,
  similarity float,
  spotify_uri text,
  album_art text,
  preview_url text,
  valence real,
  energy real
)
language sql stable as $$
  select id,
         name,
         artist,
         1 - (embedding <=> query_embedding) as similarity,
         spotify_uri,
         album_art,
         preview_url,
         valence,
         energy
  from tracks
  where embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;
