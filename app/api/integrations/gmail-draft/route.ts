import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { getGoogleToken, googleFetchJson, json, errorMessage } from "../../../google-api";
import { GMAIL_SESSION_COOKIE } from "../../../gmail-session";

function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 8192) binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { applicationId?: number; subject?: string; body?: string };
    const applicationId = Number(payload.applicationId);
    if (!Number.isSafeInteger(applicationId) || applicationId < 1 || !payload.subject?.trim() || !payload.body?.trim()) return json({ error: "INVALID_DRAFT" }, 400);
    const db = env.DB;
    const sessionId = (await cookies()).get(GMAIL_SESSION_COOKIE)?.value ?? null;
    const token = await getGoogleToken(db, sessionId);
    if (!token) return json({ error: "GOOGLE_NOT_CONNECTED", reconnect: true }, 401);
    const application = await db.prepare("SELECT contact_email AS contactEmail FROM applications WHERE id = ? AND deleted_at IS NULL")
      .bind(applicationId).first<{ contactEmail: string | null }>();
    if (!application) return json({ error: "APPLICATION_NOT_FOUND" }, 404);
    const headers = [application.contactEmail ? `To: ${application.contactEmail}` : "To:", `Subject: ${payload.subject.trim()}`, "Content-Type: text/plain; charset=UTF-8", "MIME-Version: 1.0", "", payload.body.trim()].join("\r\n");
    const draft = await googleFetchJson<{ id: string }>(db, token, "https://gmail.googleapis.com/gmail/v1/users/me/drafts", { method: "POST", body: JSON.stringify({ message: { raw: base64Url(headers) } }) });
    return json({ ok: true, draftId: draft.id, url: "https://mail.google.com/mail/u/0/#drafts" });
  } catch (error) {
    console.error("[gmail-draft] integration failed", errorMessage(error));
    return json({ error: errorMessage(error), reconnect: /403|scope|GOOGLE_NOT_CONNECTED/i.test(errorMessage(error)) }, 502);
  }
}

