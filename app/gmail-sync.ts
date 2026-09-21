import { env } from "cloudflare:workers";
import { isDuplicate, normalize } from "./record-utils";
import { isConfirmedInterview, isInterviewConfirmation, isJobRejectionResponse } from "./interview-utils";

type Database = D1Database;

type StoredApplication = {
  id: number;
  company: string;
  role: string;
  notes: string | null;
  contactEmail: string | null;
  gmailMessageId: string | null;
  gmailThreadId: string | null;
  status: string;
};

type GmailHeader = { name?: string; value?: string };
type GmailPart = {
  mimeType?: string;
  filename?: string;
  body?: { data?: string };
  parts?: GmailPart[];
};
type GmailMessage = {
  id: string;
  internalDate?: string;
  snippet?: string;
  threadId?: string;
  payload?: GmailPart & { headers?: GmailHeader[] };
};
type GmailListResponse = { messages?: Array<{ id: string }>; nextPageToken?: string };
type TokenState = { accessToken: string; refreshToken: string | null; sessionId: string };

const APPLICATION_SUBJECT_WORDS = /bewerb|initiativ|schulbegleit|it[- ]?support|service[- ]?desk|cyber|security|trainee|lehrkraft|mathematik|pädagog|erzieher/i;
const APPLICATION_BODY_WORDS = /hiermit\s+bewerbe|bewerbungsunterlagen|lebenslauf|anschreiben|für\s+die\s+(?:ausgeschriebene|offene)\s+stelle/i;
const NOT_APPLICATION_WORDS = /jobcenter|arbeitsagentur|agentur\s+für\s+arbeit|kundennummer/i;
const REPLY_FORWARD_SUBJECT = /^(?:(?:re|aw|wg|fwd|fw|antwort)\s*:\s*)+/i;
const AUTOMATED_JOB_ALERT_WORDS = /(gespeicherten?\s+stellensuche|gespeicherten?\s+suchen|neuer\s+treffer|alle\s+aktuellen\s+stellenangebote|stellenangebote\s+zu\s+ihrer\s+stellensuche|job\s+alert|saved\s+search)/i;

const runtime = () => env as Record<string, string | undefined>;

function getHeader(message: GmailMessage, name: string) {
  return message.payload?.headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value?.trim() ?? "";
}

function extractEmail(value: string) {
  return value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() ?? "";
}

function emailDomainsMatch(left: string, right: string) {
  const leftDomain = left.split("@")[1]?.toLowerCase() ?? "";
  const rightDomain = right.split("@")[1]?.toLowerCase() ?? "";
  if (!leftDomain || !rightDomain) return false;
  return leftDomain === rightDomain || leftDomain.endsWith(`.${rightDomain}`) || rightDomain.endsWith(`.${leftDomain}`);
}

function decodeBase64Url(value: string) {
  try {
    const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "="));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function collectText(part: GmailPart | undefined, plain: string[], html: string[]) {
  if (!part) return;
  const data = part.body?.data;
  if (data) {
    if (part.mimeType === "text/plain") plain.push(decodeBase64Url(data));
    if (part.mimeType === "text/html") html.push(stripHtml(decodeBase64Url(data)));
  }
  part.parts?.forEach((child) => collectText(child, plain, html));
}

function messageText(message: GmailMessage) {
  const plain: string[] = [];
  const html: string[] = [];
  collectText(message.payload, plain, html);
  return [...plain, ...html, message.snippet ?? ""].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function berlinDate(internalDate: string | undefined) {
  const date = new Date(Number(internalDate));
  if (!Number.isFinite(date.getTime())) return new Date().toISOString().slice(0, 10);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function companyFromEmail(email: string) {
  const domain = email.split("@")[1]?.split(".")[0] ?? "";
  if (!domain) return "";
  return domain.replace(/[-_]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function cleanSubject(subject: string) {
  return subject.replace(/^(?:(?:re|aw|wg|fwd|fw):\s*)+/i, "").replace(/\s+/g, " ").trim();
}

function parseApplication(message: GmailMessage) {
  const subject = getHeader(message, "Subject");
  const to = getHeader(message, "To");
  const recipientEmail = extractEmail(to);
  const body = messageText(message);
  // A reply or forwarded message is evidence about an existing application,
  // not a new application. Importing these as new rows creates duplicates.
  if (REPLY_FORWARD_SUBJECT.test(subject)) return null;
  const subjectIsRelevant = APPLICATION_SUBJECT_WORDS.test(subject);
  if (!subjectIsRelevant) return null;
  if (NOT_APPLICATION_WORDS.test(subject) && !/bewerb|bewerbe/i.test(subject)) return null;

  const clean = cleanSubject(subject);
  let role = clean.replace(/^initiativbewerbung\s*(?:als|für)?\s*/i, "").replace(/^bewerbung\s+(?:als|für|um)\s*/i, "").trim();
  let company = companyFromEmail(recipientEmail);
  const separated = clean.match(/^(?:initiativbewerbung|bewerbung)(?:\s+(?:als|für|um))?\s+(.+?)\s+[–—-]\s+(.+)$/i);
  if (separated) {
    role = separated[1].trim();
    company = separated[2].trim();
  }
  const bei = clean.match(/^(?:initiativbewerbung|bewerbung)(?:\s+(?:als|für|um))?\s+(.+?)\s+bei\s+(.+)$/i);
  if (bei) {
    role = bei[1].trim();
    company = bei[2].trim();
  }
  role = role || "Bewerbung";
  company = company || "Arbeitgeber aus Gmail";

  const haystack = `${subject} ${body}`;
  const track = /cyber|security|it[- ]?support|service[- ]?desk|trainee|netzwerk|informatik/i.test(haystack)
    ? "cyber"
    : /schule|schulbegleit|pädagog|kinder|jugend|lehrkraft|mathematik|erzieher/i.test(haystack)
      ? "teaching"
      : "other";
  const location = haystack.match(/\b(Gifhorn|Lüneburg|Wolfsburg|Braunschweig|Hannover|Bremen|Hamburg)\b/i)?.[1] ?? null;
  const appliedOn = berlinDate(message.internalDate);
  return {
    company,
    role,
    track,
    location,
    score: track === "cyber" ? 82 : track === "teaching" ? 80 : 70,
    appliedOn,
    nextActionDate: addDays(appliedOn, 7),
    contactEmail: recipientEmail || null,
    subject: subject || "Gmail başvurusu",
    body,
  };
}

function likelyApplicationSubject(subject: string, body: string) {
  return APPLICATION_SUBJECT_WORDS.test(subject) || APPLICATION_BODY_WORDS.test(body);
}

function applicationMatch(message: GmailMessage, apps: StoredApplication[]) {
  const subject = getHeader(message, "Subject");
  const headers = ["From", "To", "Cc", "Reply-To"];
  const participants = [...new Set(headers.flatMap((header) => {
    const value = getHeader(message, header);
    return [...value.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map((match) => match[0].toLowerCase());
  }))];
  const from = getHeader(message, "From");
  const fromEmail = extractEmail(from);
  const haystack = normalize(`${subject} ${headers.map((header) => getHeader(message, header)).join(" ")}`);
  const byThread = apps.find((application) => application.gmailThreadId && message.threadId && application.gmailThreadId === message.threadId);
  if (byThread) return byThread;
  const byExactParticipant = apps.find((application) => application.contactEmail && participants.includes(application.contactEmail.toLowerCase()));
  if (byExactParticipant) return byExactParticipant;
  const byDomain = apps.find((application) => application.contactEmail && participants.some((email) => emailDomainsMatch(application.contactEmail || "", email)));
  if (byDomain) return byDomain;
  return apps.find((application) => {
    const company = normalize(application.company);
    if (company.length >= 5 && haystack.includes(company)) return true;
    const role = normalize(application.role);
    return role.length >= 8 && haystack.includes(role);
  });
}

function isAutomatedJobAlert(text: string) {
  return AUTOMATED_JOB_ALERT_WORDS.test(text);
}

function responseStatus(text: string) {
  if (isJobRejectionResponse(text)) return "rejected";
  return isConfirmedInterview([{ title: text, body: "" }]) && !isAutomatedJobAlert(text) ? "interview" : "received";
}

async function refreshAccessToken(db: Database, state: TokenState) {
  const values = runtime();
  if (!state.refreshToken || !values.GOOGLE_CLIENT_ID || !values.GOOGLE_CLIENT_SECRET) throw new Error("GMAIL_REFRESH_NOT_CONFIGURED");
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
  if (!response.ok) throw new Error(`GMAIL_REFRESH_${response.status}`);
  const result = await response.json() as { access_token?: string };
  if (!result.access_token) throw new Error("GMAIL_REFRESH_EMPTY");
  state.accessToken = result.access_token;
  await db.prepare("UPDATE gmail_connections SET access_token = ?, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?").bind(state.accessToken, state.sessionId).run();
}

async function gmailJson<T>(db: Database, state: TokenState, url: string): Promise<T> {
  let response = await fetch(url, { headers: { Authorization: `Bearer ${state.accessToken}` } });
  if (response.status === 401) {
    await refreshAccessToken(db, state);
    response = await fetch(url, { headers: { Authorization: `Bearer ${state.accessToken}` } });
  }
  if (!response.ok) throw new Error(`GMAIL_API_${response.status}`);
  return await response.json() as T;
}

async function listMessages(db: Database, state: TokenState, query: string) {
  const ids: string[] = [];
  let pageToken = "";
  for (let page = 0; page < 2; page += 1) {
    const params = new URLSearchParams({ q: query, maxResults: "50" });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await gmailJson<GmailListResponse>(db, state, `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`);
    ids.push(...(data.messages ?? []).map((message) => message.id));
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return ids;
}

async function getMessage(db: Database, state: TokenState, id: string) {
  return gmailJson<GmailMessage>(db, state, `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=full`);
}

async function addDefaultSteps(db: Database, applicationId: number) {
  const steps = ["İlanı ve şartları kontrol et", "CV ve Anschreiben uyarla", "Başvuruyu gönder", "Geri dönüşü kaydet"];
  await db.batch(steps.map((label, index) => db.prepare("INSERT INTO application_steps (application_id, label, sort_order) VALUES (?, ?, ?)").bind(applicationId, label, index)));
}

async function importSentMessages(db: Database, state: TokenState, ids: string[], apps: StoredApplication[]) {
  let imported = 0;
  for (const id of ids) {
    if (apps.some((application) => application.gmailMessageId === id)) continue;
    const message = await getMessage(db, state, id);
    const candidate = parseApplication(message);
    if (!candidate || !likelyApplicationSubject(candidate.subject, candidate.body)) continue;
    const duplicate = apps.find((application) => isDuplicate(application, { company: candidate.company, role: candidate.role, notes: candidate.subject, contactEmail: candidate.contactEmail }));
    if (duplicate) {
      if (!duplicate.gmailMessageId || !duplicate.gmailThreadId) {
        await db.prepare("UPDATE applications SET gmail_message_id = COALESCE(gmail_message_id, ?), gmail_thread_id = COALESCE(gmail_thread_id, ?) WHERE id = ?").bind(id, message.threadId ?? null, duplicate.id).run();
      }
      duplicate.gmailMessageId = id;
      duplicate.gmailThreadId = message.threadId ?? duplicate.gmailThreadId;
      continue;
    }
    const notes = `Gmail'den otomatik aktarıldı. E-posta konusu: ${candidate.subject}`.slice(0, 500);
    const result = await db.prepare(`INSERT INTO applications (company, role, track, location, score, status, notes, source, applied_on, contact_email, next_action, next_action_date, gmail_message_id, gmail_thread_id)
      VALUES (?, ?, ?, ?, ?, 'waiting', ?, 'Gmail / Gesendete E-Mails', ?, ?, 'Eingangsbestätigung prüfen', ?, ?, ?)`).bind(
      candidate.company, candidate.role, candidate.track, candidate.location, candidate.score, notes, candidate.appliedOn, candidate.contactEmail, candidate.nextActionDate, id,
      message.threadId ?? null,
    ).run();
    const applicationId = Number(result.meta.last_row_id);
    await db.batch([
      db.prepare("INSERT INTO application_updates (application_id, update_type, title, body, happened_on, gmail_message_id) VALUES (?, 'E-posta', ?, ?, ?, ?)").bind(applicationId, "Bewerbung aus Gmail importiert", candidate.subject, candidate.appliedOn, id),
      db.prepare("INSERT INTO application_steps (application_id, label, sort_order) VALUES (?, ?, ?)").bind(applicationId, "İlanı ve şartları kontrol et", 0),
      db.prepare("INSERT INTO application_steps (application_id, label, sort_order) VALUES (?, ?, ?)").bind(applicationId, "CV ve Anschreiben uyarla", 1),
      db.prepare("INSERT INTO application_steps (application_id, label, sort_order) VALUES (?, ?, ?)").bind(applicationId, "Başvuruyu gönder", 2),
      db.prepare("INSERT INTO application_steps (application_id, label, sort_order) VALUES (?, ?, ?)").bind(applicationId, "Geri dönüşü kaydet", 3),
    ]);
    apps.push({ id: applicationId, company: candidate.company, role: candidate.role, notes, contactEmail: candidate.contactEmail, gmailMessageId: id, gmailThreadId: message.threadId ?? null, status: "waiting" });
    imported += 1;
  }
  return imported;
}

async function importReplies(db: Database, state: TokenState, ids: string[], apps: StoredApplication[]) {
  let updates = 0;
  for (const id of ids) {
    const message = await getMessage(db, state, id);
    const subject = getHeader(message, "Subject") || "Gmail yanıtı";
    const body = messageText(message).slice(0, 800);
    // Job-alert newsletters are not replies to an application. Skipping them
    // prevents a saved-search notification from being attached to a random
    // application just because it contains a city or a common employer word.
    if (isAutomatedJobAlert(`${subject} ${body}`)) continue;
    const application = applicationMatch(message, apps);
    if (!application) continue;
    const existing = await db.prepare("SELECT id FROM application_updates WHERE gmail_message_id = ?").bind(id).first<{ id: number }>();
    if (existing?.id) continue;
    const date = berlinDate(message.internalDate);
    const combined = `${subject} ${body}`;
    const confirmation = isInterviewConfirmation([{ title: subject, body }]);
    const status = responseStatus(combined);
    const nextStatus = status === "received" && application.status === "interview" ? "interview" : status;
    const title = confirmation ? `Gmail yanıtı (Mülakat teyidi): ${subject}` : `Gmail yanıtı: ${subject}`;
    const statements = [
      db.prepare("INSERT INTO application_updates (application_id, update_type, title, body, happened_on, gmail_message_id) VALUES (?, 'E-posta', ?, ?, ?, ?)").bind(application.id, title.slice(0, 250), body || subject, date, id),
      db.prepare("UPDATE applications SET feedback = ?, last_contact_on = ? WHERE id = ?").bind(body || subject, date, application.id),
    ];
    if (!application.gmailThreadId && message.threadId) {
      statements.push(db.prepare("UPDATE applications SET gmail_thread_id = ? WHERE id = ?").bind(message.threadId, application.id));
      application.gmailThreadId = message.threadId;
    }
    statements.push(db.prepare("UPDATE applications SET status = ?, next_action = CASE WHEN ? = 'rejected' THEN 'Başka işlem gerekmiyor' WHEN ? = 'interview' AND ? = 1 THEN 'Mülakat teyit edildi; görüşmeye hazırlan' ELSE next_action END WHERE id = ?").bind(nextStatus, nextStatus, nextStatus, confirmation ? 1 : 0, application.id));
    await db.batch(statements);
    application.status = nextStatus;
    updates += 1;
  }
  return updates;
}

export async function syncGmailApplications(db: Database, sessionId: string | null) {
  if (!sessionId) return { connected: false, imported: 0, updates: 0 };
  try {
    const connection = await db.prepare("SELECT access_token AS accessToken, refresh_token AS refreshToken FROM gmail_connections WHERE session_id = ?").bind(sessionId).first<{ accessToken: string; refreshToken: string | null }>();
    if (!connection?.accessToken) return { connected: false, imported: 0, updates: 0 };
    await db.prepare("INSERT OR IGNORE INTO gmail_sync_states (session_id) VALUES (?)").bind(sessionId).run();
    const claimed = await db.prepare(`UPDATE gmail_sync_states SET last_attempt_at = CURRENT_TIMESTAMP
      WHERE session_id = ? AND (last_attempt_at IS NULL OR last_attempt_at <= datetime('now', '-45 seconds'))`).bind(sessionId).run();
    if (!claimed.meta.changes) return { connected: true, imported: 0, updates: 0 };

    const state: TokenState = { accessToken: connection.accessToken, refreshToken: connection.refreshToken, sessionId };
    const appsResult = await db.prepare("SELECT id, company, role, notes, contact_email AS contactEmail, gmail_message_id AS gmailMessageId, gmail_thread_id AS gmailThreadId, status FROM applications WHERE deleted_at IS NULL").all<StoredApplication>();
    const apps = appsResult.results;
    const sentIds = await listMessages(db, state, "in:sent newer_than:180d");
    const imported = await importSentMessages(db, state, sentIds, apps);
    const inboxIds = await listMessages(db, state, "in:inbox -from:me newer_than:180d");
    const sentReplyIds = sentIds.filter((id) => !apps.some((application) => application.gmailMessageId === id));
    const replyIds = [...new Set([...sentReplyIds, ...inboxIds])];
    const updates = await importReplies(db, state, replyIds, apps);
    await db.prepare("UPDATE gmail_sync_states SET last_sync_at = CURRENT_TIMESTAMP, last_error = NULL, messages_imported = ? WHERE session_id = ?").bind(imported + updates, sessionId).run();
    return { connected: true, imported, updates };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.prepare("CREATE TABLE IF NOT EXISTS gmail_sync_states (session_id TEXT PRIMARY KEY, last_sync_at TEXT, last_attempt_at TEXT, last_error TEXT, messages_imported INTEGER NOT NULL DEFAULT 0)").run();
    await db.prepare("UPDATE gmail_sync_states SET last_error = ? WHERE session_id = ?").bind(message.slice(0, 250), sessionId).run();
    console.error("[gmail-sync] synchronization failed", message);
    return { connected: false, imported: 0, updates: 0, error: message };
  }
}
