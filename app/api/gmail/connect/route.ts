import { env } from "cloudflare:workers";
import { getGmailSessionId, gmailSessionCookie, newGmailSessionId } from "../../../gmail-session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientId = (env as Record<string, string | undefined>).GOOGLE_CLIENT_ID;
  const redirectUri = (env as Record<string, string | undefined>).GOOGLE_REDIRECT_URI;
  if (!clientId || !redirectUri) return new Response("Gmail bağlantısı henüz yapılandırılmadı.", { status: 503 });
  const sessionId = getGmailSessionId(request) ?? newGmailSessionId();
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", clientId);
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("access_type", "offline");
  auth.searchParams.set("prompt", "consent");
  auth.searchParams.set("scope", "https://www.googleapis.com/auth/gmail.readonly");
  auth.searchParams.set("state", sessionId);
  return new Response(null, {
    status: 302,
    headers: {
      Location: auth.toString(),
      "Set-Cookie": gmailSessionCookie(sessionId),
    },
  });
}
