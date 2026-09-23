import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { getGoogleToken, googleFetchJson, json, errorMessage } from "../../../google-api";
import { GMAIL_SESSION_COOKIE } from "../../../gmail-session";

type GmailLabel = { id: string; name: string };

function labelName(status: string) {
  return ({ interview: "Bewerbung/Interview", rejected: "Bewerbung/Absage", received: "Bewerbung/Rückmeldung", waiting: "Bewerbung/Warten", sent: "Bewerbung/Gesendet", new: "Bewerbung/Neu", listed: "Bewerbung/Gemerkt" } as Record<string, string>)[status] || "Bewerbung/Andere";
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { applicationId?: number };
    const applicationId = Number(payload.applicationId);
    if (!Number.isSafeInteger(applicationId) || applicationId < 1) return json({ error: "INVALID_APPLICATION" }, 400);
    const db = env.DB;
    const sessionId = (await cookies()).get(GMAIL_SESSION_COOKIE)?.value ?? null;
    const token = await getGoogleToken(db, sessionId);
    if (!token) return json({ error: "GOOGLE_NOT_CONNECTED", reconnect: true }, 401);
    const application = await db.prepare("SELECT status, gmail_thread_id AS gmailThreadId FROM applications WHERE id = ? AND deleted_at IS NULL")
      .bind(applicationId).first<{ status: string; gmailThreadId: string | null }>();
    if (!application?.gmailThreadId) return json({ error: "GMAIL_THREAD_NOT_FOUND" }, 404);
    const labels = await googleFetchJson<{ labels?: GmailLabel[] }>(db, token, "https://gmail.googleapis.com/gmail/v1/users/me/labels");
    const name = labelName(application.status);
    let label = labels.labels?.find((item) => item.name === name);
    if (!label) label = await googleFetchJson<GmailLabel>(db, token, "https://gmail.googleapis.com/gmail/v1/users/me/labels", { method: "POST", body: JSON.stringify({ name, labelListVisibility: "labelShow", messageListVisibility: "show" }) });
    await googleFetchJson(db, token, `https://gmail.googleapis.com/gmail/v1/users/me/threads/${encodeURIComponent(application.gmailThreadId)}/modify`, { method: "POST", body: JSON.stringify({ addLabelIds: [label.id] }) });
    return json({ ok: true, label: name });
  } catch (error) {
    console.error("[gmail-label] integration failed", errorMessage(error));
    return json({ error: errorMessage(error), reconnect: /403|scope|GOOGLE_NOT_CONNECTED/i.test(errorMessage(error)) }, 502);
  }
}

