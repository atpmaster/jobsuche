import { env } from "cloudflare:workers";
import { clearGmailSessionCookie, getGmailSessionId } from "../../../gmail-session";

export async function POST(request: Request) {
  const sessionId = getGmailSessionId(request);
  if (sessionId) {
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS gmail_connections (session_id TEXT PRIMARY KEY, access_token TEXT NOT NULL, refresh_token TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS gmail_sync_states (session_id TEXT PRIMARY KEY, last_sync_at TEXT, last_attempt_at TEXT, last_error TEXT, messages_imported INTEGER NOT NULL DEFAULT 0)").run();
    await env.DB.batch([
      env.DB.prepare("DELETE FROM gmail_connections WHERE session_id = ?").bind(sessionId),
      env.DB.prepare("DELETE FROM gmail_sync_states WHERE session_id = ?").bind(sessionId),
    ]);
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL("/", request.url).toString(),
      "Set-Cookie": clearGmailSessionCookie(),
    },
  });
}
