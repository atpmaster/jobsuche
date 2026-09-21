import { env } from "cloudflare:workers";

export type GoogleTokenState = {
  accessToken: string;
  refreshToken: string | null;
  sessionId: string;
};

const runtime = () => env as Record<string, string | undefined>;

export async function getGoogleToken(db: D1Database, sessionId: string | null) {
  if (!sessionId) return null;
  const connection = await db.prepare("SELECT access_token AS accessToken, refresh_token AS refreshToken FROM gmail_connections WHERE session_id = ?")
    .bind(sessionId)
    .first<{ accessToken: string; refreshToken: string | null }>();
  if (!connection?.accessToken) return null;
  return { ...connection, sessionId } satisfies GoogleTokenState;
}

async function refreshGoogleToken(db: D1Database, state: GoogleTokenState) {
  const values = runtime();
  if (!state.refreshToken || !values.GOOGLE_CLIENT_ID || !values.GOOGLE_CLIENT_SECRET) throw new Error("GOOGLE_REFRESH_NOT_CONFIGURED");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: values.GOOGLE_CLIENT_ID,
      client_secret: values.GOOGLE_CLIENT_SECRET,
      refresh_token: state.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) throw new Error(`GOOGLE_REFRESH_${response.status}`);
  const result = await response.json() as { access_token?: string };
  if (!result.access_token) throw new Error("GOOGLE_REFRESH_EMPTY");
  state.accessToken = result.access_token;
  await db.prepare("UPDATE gmail_connections SET access_token = ?, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?")
    .bind(state.accessToken, state.sessionId)
    .run();
}

export async function googleFetchJson<T>(db: D1Database, state: GoogleTokenState, url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${state.accessToken}`);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  let response = await fetch(url, { ...init, headers });
  if (response.status === 401) {
    await refreshGoogleToken(db, state);
    headers.set("authorization", `Bearer ${state.accessToken}`);
    response = await fetch(url, { ...init, headers });
  }
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`GOOGLE_API_${response.status}${detail ? `: ${detail}` : ""}`);
  }
  return await response.json() as T;
}

export async function googleFetchNoContent(db: D1Database, state: GoogleTokenState, url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${state.accessToken}`);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  let response = await fetch(url, { ...init, headers });
  if (response.status === 401) {
    await refreshGoogleToken(db, state);
    headers.set("authorization", `Bearer ${state.accessToken}`);
    response = await fetch(url, { ...init, headers });
  }
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`GOOGLE_API_${response.status}${detail ? `: ${detail}` : ""}`);
  }
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

