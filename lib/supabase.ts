import {
  createBrowserClient,
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      tracks: {
        Row: {
          id: string;
          name: string;
          artist: string;
          genre: string | null;
          popularity: number | null;
          valence: number | null;
          energy: number | null;
          tempo: number | null;
          acousticness: number | null;
          danceability: number | null;
          spotify_uri: string | null;
          album_art: string | null;
          preview_url: string | null;
          embedding: string | null;
          embedding_pending: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          name: string;
          artist: string;
          genre?: string | null;
          popularity?: number | null;
          valence?: number | null;
          energy?: number | null;
          tempo?: number | null;
          acousticness?: number | null;
          danceability?: number | null;
          spotify_uri?: string | null;
          album_art?: string | null;
          preview_url?: string | null;
          embedding?: string | null;
          embedding_pending?: boolean | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tracks"]["Insert"]>;
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["sessions"]["Insert"]>;
        Relationships: [];
      };
      taste_profiles: {
        Row: {
          session_id: string;
          summary: string;
          rating_count: number;
          updated_at: string | null;
        };
        Insert: {
          session_id: string;
          summary: string;
          rating_count?: number;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["taste_profiles"]["Insert"]>;
        Relationships: [];
      };
      feedback: {
        Row: {
          id: number;
          session_id: string;
          track_id: string;
          rating: number;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          session_id: string;
          track_id: string;
          rating: number;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["feedback"]["Insert"]>;
        Relationships: [];
      };
      explanation_cache: {
        Row: {
          cache_key: string;
          explanation: string;
          created_at: string | null;
        };
        Insert: {
          cache_key: string;
          explanation: string;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["explanation_cache"]["Insert"]>;
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: number;
          session_id: string;
          role: "user" | "assistant";
          content: string;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          session_id: string;
          role: "user" | "assistant";
          content: string;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_tracks: {
        Args: {
          query_embedding: number[];
          match_count?: number;
        };
        Returns: {
          id: string;
          name: string;
          artist: string;
          similarity: number;
          spotify_uri: string | null;
          album_art: string | null;
          preview_url: string | null;
          valence: number | null;
          energy: number | null;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

type ServerCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

type ServerCookieStore = {
  getAll(): ServerCookie[];
  setAll(cookies: ServerCookie[]): void;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}

export function createSupabaseServerClient(cookieStore: ServerCookieStore) {
  return createServerClient<Database>(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies: ServerCookie[]) {
          cookieStore.setAll(cookies);
        },
      },
    },
  );
}

export function createSupabaseAdminClient() {
  return createClient<Database>(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
