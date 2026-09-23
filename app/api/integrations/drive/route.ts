import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { getGoogleToken, googleFetchJson, json, errorMessage } from "../../../google-api";
import { GMAIL_SESSION_COOKIE } from "../../../gmail-session";

type DriveFile = { id: string; webViewLink?: string };

async function folderForApplication(db: D1Database, token: Awaited<ReturnType<typeof getGoogleToken>>, applicationId: number, company: string, role: string) {
  if (!token) throw new Error("GOOGLE_NOT_CONNECTED");
  const existing = await db.prepare("SELECT provider_file_id AS providerFileId, web_view_link AS webViewLink FROM google_drive_folders WHERE application_id = ?")
    .bind(applicationId).first<{ providerFileId: string; webViewLink: string | null }>();
  if (existing) return { id: existing.providerFileId, url: existing.webViewLink };
  const name = `${company} – ${role}`.replace(/[\\/:*?"<>|]/g, " ").slice(0, 120);
  const created = await googleFetchJson<DriveFile>(db, token, "https://www.googleapis.com/drive/v3/files?fields=id,webViewLink", {
    method: "POST", body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder" }),
  });
  await db.prepare(`INSERT INTO google_drive_folders (application_id, provider_file_id, web_view_link, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(application_id) DO UPDATE SET provider_file_id=excluded.provider_file_id, web_view_link=excluded.web_view_link, updated_at=CURRENT_TIMESTAMP`)
    .bind(applicationId, created.id, created.webViewLink ?? null).run();
  return { id: created.id, url: created.webViewLink ?? `https://drive.google.com/drive/folders/${created.id}` };
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const applicationId = Number(form.get("applicationId"));
    if (!Number.isSafeInteger(applicationId) || applicationId < 1) return json({ error: "INVALID_APPLICATION" }, 400);
    const db = env.DB;
    const sessionId = (await cookies()).get(GMAIL_SESSION_COOKIE)?.value ?? null;
    const token = await getGoogleToken(db, sessionId);
    if (!token) return json({ error: "GOOGLE_NOT_CONNECTED", reconnect: true }, 401);
    const application = await db.prepare("SELECT company, role FROM applications WHERE id = ? AND deleted_at IS NULL")
      .bind(applicationId).first<{ company: string; role: string }>();
    if (!application) return json({ error: "APPLICATION_NOT_FOUND" }, 404);
    const folder = await folderForApplication(db, token, applicationId, application.company, application.role);
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return json({ ok: true, folderUrl: folder.url, uploaded: false });
    const boundary = `ahmettepe${crypto.randomUUID().replaceAll("-", "")}`;
    const metadata = JSON.stringify({ name: String(form.get("fileName") || file.name || "Bewerbungsbericht.pdf"), parents: [folder.id], mimeType: file.type || "application/pdf" });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const prefix = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${file.type || "application/pdf"}\r\n\r\n`;
    const suffix = `\r\n--${boundary}--`;
    const body = new Uint8Array(prefix.length + bytes.length + suffix.length);
    body.set(new TextEncoder().encode(prefix), 0); body.set(bytes, prefix.length); body.set(new TextEncoder().encode(suffix), prefix.length + bytes.length);
    const uploaded = await googleFetchJson<DriveFile>(db, token, "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {
      method: "POST", headers: { "content-type": `multipart/related; boundary=${boundary}` }, body,
    });
    return json({ ok: true, folderUrl: folder.url, uploaded: true, fileUrl: uploaded.webViewLink ?? null });
  } catch (error) {
    console.error("[drive] integration failed", errorMessage(error));
    return json({ error: errorMessage(error), reconnect: /403|scope|GOOGLE_NOT_CONNECTED/i.test(errorMessage(error)) }, 502);
  }
}

