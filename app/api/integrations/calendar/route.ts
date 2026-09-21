import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { getGoogleToken, googleFetchJson, json, errorMessage } from "../../../google-api";
import { GMAIL_SESSION_COOKIE } from "../../../gmail-session";

type CalendarEvent = { id: string; htmlLink?: string };

function addMinutes(value: string, minutes: number) {
  const base = new Date(`${value}:00Z`);
  if (!Number.isFinite(base.getTime())) throw new Error("INVALID_INTERVIEW_TIME");
  base.setUTCMinutes(base.getUTCMinutes() + minutes);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${base.getUTCFullYear()}-${pad(base.getUTCMonth() + 1)}-${pad(base.getUTCDate())}T${pad(base.getUTCHours())}:${pad(base.getUTCMinutes())}:00`;
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
    const record = await db.prepare(`SELECT a.company, a.role, a.location, a.gmail_thread_id AS gmailThreadId,
        i.starts_at AS startsAt, i.duration, i.location AS interviewLocation, i.notes
      FROM applications a JOIN interviews i ON i.application_id = a.id
      WHERE a.id = ? AND a.deleted_at IS NULL ORDER BY i.starts_at LIMIT 1`).bind(applicationId).first<{
      company: string; role: string; location: string | null; gmailThreadId: string | null;
      startsAt: string; duration: number; interviewLocation: string | null; notes: string | null;
    }>();
    if (!record) return json({ error: "INTERVIEW_NOT_FOUND" }, 404);
    const existing = await db.prepare("SELECT provider_event_id AS providerEventId FROM google_calendar_events WHERE application_id = ?")
      .bind(applicationId).first<{ providerEventId: string }>();
    const threadLink = record.gmailThreadId ? `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(record.gmailThreadId)}` : "";
    const event = {
      summary: `Vorstellungsgespräch – ${record.role} | ${record.company}`,
      description: [`Bewerbung: ${record.role} bei ${record.company}`, record.notes || "", threadLink ? `Gmail-Thread: ${threadLink}` : ""].filter(Boolean).join("\n\n"),
      location: record.interviewLocation || record.location || "",
      start: { dateTime: `${record.startsAt}:00`, timeZone: "Europe/Berlin" },
      end: { dateTime: addMinutes(record.startsAt, record.duration || 60), timeZone: "Europe/Berlin" },
      reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 1440 }, { method: "popup", minutes: 60 }] },
    };
    let saved: CalendarEvent;
    if (existing?.providerEventId) {
      try {
        saved = await googleFetchJson<CalendarEvent>(db, token, `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(existing.providerEventId)}`, { method: "PATCH", body: JSON.stringify(event) });
      } catch (error) {
        if (!String(errorMessage(error)).startsWith("GOOGLE_API_404")) throw error;
        saved = await googleFetchJson<CalendarEvent>(db, token, "https://www.googleapis.com/calendar/v3/calendars/primary/events", { method: "POST", body: JSON.stringify(event) });
      }
    } else {
      saved = await googleFetchJson<CalendarEvent>(db, token, "https://www.googleapis.com/calendar/v3/calendars/primary/events", { method: "POST", body: JSON.stringify(event) });
    }
    await db.prepare(`INSERT INTO google_calendar_events (application_id, provider_event_id, web_view_link, starts_at, duration, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(application_id) DO UPDATE SET provider_event_id=excluded.provider_event_id, web_view_link=excluded.web_view_link, starts_at=excluded.starts_at, duration=excluded.duration, updated_at=CURRENT_TIMESTAMP`)
      .bind(applicationId, saved.id, saved.htmlLink ?? null, record.startsAt, record.duration || 60).run();
    return json({ ok: true, url: saved.htmlLink ?? null, eventId: saved.id });
  } catch (error) {
    console.error("[calendar] integration failed", errorMessage(error));
    return json({ error: errorMessage(error), reconnect: /403|scope|GOOGLE_NOT_CONNECTED/i.test(errorMessage(error)) }, 502);
  }
}

