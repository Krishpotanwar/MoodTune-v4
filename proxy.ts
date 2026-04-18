import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function proxy(request: NextRequest): NextResponse {
  const existingSessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionId = existingSessionId ?? crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-mt-sid", sessionId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (!existingSessionId) {
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE_SECONDS,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/journey/:path*",
    "/profile/:path*",
    "/api/chat/:path*",
    "/api/search/:path*",
    "/api/feedback/:path*",
    "/api/explain/:path*",
    "/api/journey/:path*",
    "/api/spotify/:path*",
    "/api/profile/:path*",
    "/api/health/:path*",
  ],
};
