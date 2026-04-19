import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") ?? "";
  const error = searchParams.get("error") ?? "";

  const html = `<!DOCTYPE html>
<html>
<head><title>Connecting Spotify…</title></head>
<body>
<script>
  (function() {
    var payload = ${JSON.stringify({ code, error })};
    if (window.opener) {
      window.opener.postMessage({ type: "spotify-callback", ...payload }, window.location.origin);
      window.close();
    } else {
      var url = new URL(window.location.href);
      url.pathname = "/studio";
      url.search = payload.code ? "?spotify_code=" + encodeURIComponent(payload.code) : "?spotify_error=" + encodeURIComponent(payload.error);
      window.location.replace(url.toString());
    }
  })();
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
