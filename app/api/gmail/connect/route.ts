import { env } from "cloudflare:workers";
import { getGmailRedirectUri } from "../../../gmail-redirect";
import { getGmailSessionId, gmailSessionCookie, newGmailSessionId } from "../../../gmail-session";

export async function GET(request: Request) {
  const clientId = (env as Record<string, string | undefined>).GOOGLE_CLIENT_ID;
  const configuredRedirectUri = (env as Record<string, string | undefined>).GOOGLE_REDIRECT_URI;
  const redirectUri = getGmailRedirectUri(request, configuredRedirectUri);
  if (!clientId) return new Response("Gmail bağlantısı henüz yapılandırılmadı.", { status: 503 });
  const sessionId = getGmailSessionId(request) ?? newGmailSessionId();
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", clientId);
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("access_type", "offline");
  auth.searchParams.set("prompt", "select_account consent");
  auth.searchParams.set("scope", [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/drive.file",
  ].join(" "));
  auth.searchParams.set("state", sessionId);
  return new Response(null, {
    status: 302,
    headers: {
      Location: auth.toString(),
      "Set-Cookie": gmailSessionCookie(sessionId),
    },
  });
}
