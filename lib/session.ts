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

export function getSessionIdFromHeaderValues(
  headerSessionId: string | null,
  cookieHeader: string | null,
): string | null {
  if (headerSessionId) {
    return headerSessionId;
  }

  return parseCookieHeader(cookieHeader).get(SESSION_COOKIE_NAME) ?? null;
}

export function getSessionId(request: Request): string | null {
  return getSessionIdFromHeaderValues(
    request.headers.get("x-mt-sid"),
    request.headers.get("cookie"),
  );
}

export function getSessionIdFromHeaders(headers: {
  get(name: string): string | null;
}): string | null {
  return getSessionIdFromHeaderValues(
    headers.get("x-mt-sid"),
    headers.get("cookie"),
  );
}

export async function ensureSession(sessionId: string): Promise<void> {
  const { createSupabaseAdminClient } = await import("@/lib/supabase");
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("sessions")
    .upsert({ id: sessionId }, { onConflict: "id", ignoreDuplicates: true });

  if (error) {
    throw error;
  }
}
