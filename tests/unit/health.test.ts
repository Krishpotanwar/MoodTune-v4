import { GET } from "@/app/api/health/route";

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      select: vi.fn().mockResolvedValue({
        count: 0,
        error: null,
      }),
    }),
  }),
}));

vi.mock("@/lib/gemini", () => ({
  callWithFallback: vi.fn(async (fn: () => Promise<boolean>) => fn()),
  isGeminiDisabled: vi.fn(() => true),
  pingGemini: vi.fn(async () => true),
}));

vi.mock("@/lib/embeddings", () => ({
  embed: vi.fn(async () => Array.from({ length: 384 }, () => 0.1)),
}));

describe("GET /api/health", () => {
  it("returns the expected health payload shape", async () => {
    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "ok",
      db_ok: true,
      gemini_ok: true,
      embed_ok: true,
      corpus_size: 0,
    });
  });
});
