import { beforeEach, describe, expect, test } from "vitest";
import { GET, PATCH } from "@/app/api/profile/route";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase";

const SESSION_A = "44444444-4444-4444-8444-444444444444";
const SESSION_B = "55555555-5555-4555-8555-555555555555";

function buildRequest(sessionId: string, method: "GET" | "PATCH", body?: unknown) {
  return new Request("http://localhost/api/profile", {
    method,
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${sessionId}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("/api/profile", () => {
  beforeEach(async () => {
    const admin = createSupabaseAdminClient();
    await admin.from("taste_profiles").delete().in("session_id", [SESSION_A, SESSION_B]);
    await admin.from("sessions").delete().in("id", [SESSION_A, SESSION_B]);
  });

  test("keeps reads and writes isolated to the session cookie", async () => {
    const patchA = await PATCH(
      buildRequest(SESSION_A, "PATCH", {
        summary: "Session A likes shadowy, low-energy songs.",
      }),
    );
    const getB = await GET(buildRequest(SESSION_B, "GET"));
    const patchB = await PATCH(
      buildRequest(SESSION_B, "PATCH", {
        summary: "Session B likes bright, high-energy tracks.",
      }),
    );
    const getA = await GET(buildRequest(SESSION_A, "GET"));
    const getBAfter = await GET(buildRequest(SESSION_B, "GET"));

    expect(patchA.status).toBe(200);
    expect(getB.status).toBe(404);
    expect(patchB.status).toBe(200);

    await expect(getA.json()).resolves.toMatchObject({
      summary: "Session A likes shadowy, low-energy songs.",
    });
    await expect(getBAfter.json()).resolves.toMatchObject({
      summary: "Session B likes bright, high-energy tracks.",
    });
  });
});
