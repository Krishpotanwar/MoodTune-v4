export const SESSION_COOKIE_NAME = "mt_sid";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Simple UUID v4 fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createSessionId(): string {
  return generateUUID();
}

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

export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export async function ensureSession(sessionId: string): Promise<string> {
  const { createSupabaseAdminClient } = await import("@/lib/supabase");
  const admin = createSupabaseAdminClient();
  
  // Generate valid UUID if missing or invalid
  const validId = !sessionId || !isValidUUID(sessionId) ? createSessionId() : sessionId;
  
  const { error } = await admin
    .from("sessions")
    .upsert({ id: validId }, { onConflict: "id", ignoreDuplicates: true });

  if (error) {
    throw error;
  }
  
  return validId;
}
