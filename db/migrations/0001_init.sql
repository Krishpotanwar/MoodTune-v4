create extension if not exists vector;

create table tracks (
  id text primary key,
  name text not null,
  artist text not null,
  genre text,
  popularity int,
  valence real,
  energy real,
  tempo real,
  acousticness real,
  danceability real,
  spotify_uri text,
  album_art text,
  preview_url text,
  embedding vector(384),
  embedding_pending boolean default false,
  created_at timestamptz default now()
);

create index tracks_embedding_idx
  on tracks using hnsw (embedding vector_cosine_ops);

create index tracks_embedding_pending_idx
  on tracks (embedding_pending) where embedding_pending = true;

create table sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

create table taste_profiles (
  session_id uuid primary key references sessions(id) on delete cascade,
  summary text not null,
  rating_count int not null default 0,
  updated_at timestamptz default now()
);

create table feedback (
  id bigserial primary key,
  session_id uuid not null references sessions(id) on delete cascade,
  track_id text not null references tracks(id),
  rating int not null check (rating in (-1, 1)),
  created_at timestamptz default now()
);

create index feedback_session_idx on feedback (session_id, created_at desc);

create table explanation_cache (
  cache_key text primary key,
  explanation text not null,
  created_at timestamptz default now()
);

create index explanation_cache_created_idx on explanation_cache (created_at);

create table chat_messages (
  id bigserial primary key,
  session_id uuid not null references sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

create index chat_messages_session_idx on chat_messages (session_id, created_at);
create index chat_messages_created_idx on chat_messages (created_at);

alter table tracks enable row level security;
alter table sessions enable row level security;
alter table taste_profiles enable row level security;
alter table feedback enable row level security;
alter table explanation_cache enable row level security;
alter table chat_messages enable row level security;

create policy tracks_anon_read on tracks for select to anon using (true);
