import { env } from "cloudflare:workers";
import { getGmailSessionId, gmailSessionCookie } from "../../../gmail-session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  if (error || !code) return new Response("Gmail bağlantısı iptal edildi.", { status: 400 });
  const sessionId = getGmailSessionId(request);
  if (!sessionId || !state || state !== sessionId) return new Response("Gmail bağlantısı doğrulanamadı. Lütfen bu tarayıcıdan yeniden bağlanın.", { status: 400 });
  const runtime = env as Record<string, string | undefined>;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: runtime.GOOGLE_CLIENT_ID ?? "",
      client_secret: runtime.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: runtime.GOOGLE_REDIRECT_URI ?? url.origin + "/api/gmail/callback",
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) return new Response("Gmail yetkilendirmesi tamamlanamadı.", { status: 502 });
  const tokens = await response.json() as { access_token?: string; refresh_token?: string };
  if (!tokens.access_token) return new Response("Gmail erişim anahtarı alınamadı.", { status: 502 });
  const db = env.DB;
  await db.prepare("CREATE TABLE IF NOT EXISTS gmail_connections (session_id TEXT PRIMARY KEY, access_token TEXT NOT NULL, refresh_token TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
  await db.prepare("INSERT INTO gmail_connections (session_id, access_token, refresh_token) VALUES (?, ?, ?) ON CONFLICT(session_id) DO UPDATE SET access_token=excluded.access_token, refresh_token=COALESCE(excluded.refresh_token, gmail_connections.refresh_token), updated_at=CURRENT_TIMESTAMP")
    .bind(sessionId, tokens.access_token, tokens.refresh_token ?? null).run();
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.origin + "/?gmail=connected",
      "Set-Cookie": gmailSessionCookie(sessionId),
    },
  });
}
