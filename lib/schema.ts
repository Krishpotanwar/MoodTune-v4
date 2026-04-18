import { z } from 'zod';

export const SearchRequestSchema = z.object({
  query: z.string().min(1).max(200),
  n: z.number().int().min(1).max(50).default(10),
});

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
});

export const TrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  artist: z.string(),
  similarity: z.number(),
  spotify_uri: z.string().nullable().optional(),
  album_art: z.string().nullable().optional(),
  preview_url: z.string().nullable().optional(),
  valence: z.number().nullable().optional(),
  energy: z.number().nullable().optional(),
});

export const SearchResponseSchema = z.object({
  tracks: z.array(TrackSchema),
  blend_used: z.boolean(),
});

export const ChatResponseSchema = z.object({
  reply: z.string(),
  query: z.string(),
  tracks: z.array(TrackSchema),
  blend_used: z.boolean(),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type Track = z.infer<typeof TrackSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
