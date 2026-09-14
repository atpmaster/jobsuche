export const GMAIL_SESSION_COOKIE = "gmail_session";

function cookieValue(header: string | null, name: string) {
  const prefix = `${name}=`;
  return header?.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix))?.slice(prefix.length) ?? null;
}

export function getGmailSessionId(request: Request) {
  return cookieValue(request.headers.get("cookie"), GMAIL_SESSION_COOKIE);
}

export function newGmailSessionId() {
  return crypto.randomUUID();
}

export function gmailSessionCookie(sessionId: string) {
  return `${GMAIL_SESSION_COOKIE}=${sessionId}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`;
}

export function clearGmailSessionCookie() {
  return `${GMAIL_SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}
