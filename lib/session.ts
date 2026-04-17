import { createSupabaseAdminClient } from "@/lib/supabase";

export const SESSION_COOKIE_NAME = "mt_sid";

function parseCookieHeader(cookieHeader: string | null): Map<string, string> {
  const cookies = new Map<string, string>();

  if (!cookieHeader) {
    return cookies;
  }

  for (const chunk of cookieHeader.split(";")) {
    const [rawName, ...rawValueParts] = chunk.trim().split("=");

    if (!rawName) {
      continue;
    }

    cookies.set(rawName, rawValueParts.join("="));
  }

  return cookies;
}

export function getSessionId(request: Request): string | null {
  const headerSessionId = request.headers.get("x-mt-sid");

  if (headerSessionId) {
    return headerSessionId;
  }

  return parseCookieHeader(request.headers.get("cookie")).get(
    SESSION_COOKIE_NAME,
  ) ?? null;
}

export async function ensureSession(sessionId: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("sessions")
    .upsert({ id: sessionId }, { onConflict: "id", ignoreDuplicates: true });

  if (error) {
    throw error;
  }
}
