"use server";

import { env } from "cloudflare:workers";
import { revalidatePath } from "next/cache";
import { isDuplicate } from "./record-utils";
import { getCareerData } from "./career-actions";

type Application = {
  deletedAt: string | null;
  id: number;
  company: string;
  role: string;
  track: string;
  location: string | null;
  score: number;
  status: string;
  deadline: string | null;
  url: string | null;
  notes: string | null;
  source: string | null;
  appliedOn: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  lastContactOn: string | null;
  nextAction: string | null;
  nextActionDate: string | null;
  feedback: string | null;
};

type Task = { id: number; title: string; category: string; estimate: string; done: number };

const statuses = new Set(["saved", "preparing", "applied", "interview", "offer", "rejected", "withdrawn"]);

async function ensureColumn(db: D1Database, table: string, column: string, definition: string) {
  const info = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
  if (!info.results.some((item) => item.name === column)) {
    await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
}

async function prepareDb() {
  const db = env.DB;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS applications (id INTEGER PRIMARY KEY AUTOINCREMENT, company TEXT NOT NULL, role TEXT NOT NULL, track TEXT NOT NULL DEFAULT 'other', location TEXT, score INTEGER NOT NULL DEFAULT 50 CHECK(score BETWEEN 0 AND 100), status TEXT NOT NULL DEFAULT 'saved', deadline TEXT, url TEXT, notes TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'Kariyer', estimate TEXT NOT NULL DEFAULT '30 dk', done INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS application_steps (id INTEGER PRIMARY KEY AUTOINCREMENT, application_id INTEGER NOT NULL, label TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS application_updates (id INTEGER PRIMARY KEY AUTOINCREMENT, application_id INTEGER NOT NULL, update_type TEXT NOT NULL DEFAULT 'Not', title TEXT NOT NULL, body TEXT, happened_on TEXT NOT NULL DEFAULT CURRENT_DATE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_tasks_done_sort ON tasks(done, sort_order)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_application_steps_app ON application_steps(application_id, sort_order)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_application_updates_app ON application_updates(application_id, happened_on)`),
  ]);

  await Promise.all([
    ensureColumn(db, "applications", "source", "TEXT"),
    ensureColumn(db, "applications", "applied_on", "TEXT"),
    ensureColumn(db, "applications", "contact_name", "TEXT"),
    ensureColumn(db, "applications", "contact_email", "TEXT"),
    ensureColumn(db, "applications", "contact_phone", "TEXT"),
    ensureColumn(db, "applications", "last_contact_on", "TEXT"),
    ensureColumn(db, "applications", "next_action", "TEXT"),
    ensureColumn(db, "applications", "next_action_date", "TEXT"),
    ensureColumn(db, "applications", "feedback", "TEXT"),
  ]);

  const seeds = [
    {
      company: "myschoolcare Nord GmbH",
      role: "Schulbegleiter (m/w/d) in Gifhorn",
      track: "teaching",
      location: "Gifhorn",
      score: 88,
      status: "applied",
      appliedOn: "2026-08-03",
      source: "Arbeitsagentur / myschoolcare",
      url: "https://www.arbeitsagentur.de/jobsuche/jobdetail/10000-1204133381-S",
      notes: "20–40 saat; başvuru portalında tamamlandı.",
      nextAction: "Geri dönüşü kontrol et",
      nextActionDate: "2026-09-15",
    },
    {
      company: "Landkreis Gifhorn",
      role: "Initiativbewerbung – Digitalisierung & IT-Sicherheit",
      track: "cyber",
      location: "Gifhorn",
      score: 93,
      status: "applied",
      appliedOn: "2026-09-08",
      source: "Landkreis Gifhorn / Bewerbermanagement",
      url: "https://bewerbermanagement.net/jobposting/14082e0cb1e54183403193689bda5f5475cb6338",
      notes: "Vollzeit, ab sofort; portalda başarıyla gönderildi.",
      nextAction: "Başvuru teyidini ve açık pozisyonları izle",
      nextActionDate: "2026-09-16",
    },
    {
      company: "IT-Verbund Gifhorn",
      role: "KI-Koordination",
      track: "cyber",
      location: "Gifhorn",
      score: 90,
      status: "applied",
      appliedOn: "2026-09-02",
      source: "IT-Verbund Gifhorn / Karriereportal",
      url: "https://itvgf.de/",
      notes: "Başvuru alındı teyidi geldi; Personalteam incelemesinden sonra dönüş yapılacak.",
      nextAction: "Yanıt için takip tarihi geldiğinde kontrol et",
      nextActionDate: "2026-09-16",
      feedback: "Otomatik alındı teyidi: belgeler dikkatle inceleniyor.",
    },
    {
      company: "BBS I des Landkreises Gifhorn",
      role: "Theorielehrkraft Mathematik & Informatik",
      track: "teaching",
      location: "Gifhorn",
      score: 96,
      status: "applied",
      appliedOn: "2026-09-11",
      source: "EIS-Online-BBS / E-Mail",
      url: "https://www.eis-online-bbs.niedersachsen.de/",
      notes: "Stellennummer 18049-26 · unterschriebener Bewerbungsbogen und aktualisierte Unterlagen nachgereicht.",
      nextAction: "Eingangsbestätigung prüfen",
      nextActionDate: "2026-09-18",
      contactName: "Bianca Brauns",
      contactEmail: "verwaltung@bbs1-gifhorn.de",
      feedback: "Bewerbung und 18-seitige Unterlagen per E-Mail versendet; Rückmeldung ausstehend.",
    },
  ];

  const existingCount = await db.prepare("SELECT COUNT(*) AS count FROM applications").first<{count:number}>();
  for (const seed of existingCount?.count ? [] : seeds) {
    await db.prepare(`INSERT INTO applications (company, role, track, location, score, status, applied_on, source, url, notes, next_action, next_action_date, feedback, contact_name, contact_email)
      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM applications WHERE company = ? AND role = ?)`)
      .bind(seed.company, seed.role, seed.track, seed.location, seed.score, seed.status, seed.appliedOn, seed.source, seed.url, seed.notes, seed.nextAction, seed.nextActionDate, seed.feedback ?? null, seed.contactName ?? null, seed.contactEmail ?? null, seed.company, seed.role)
      .run();
  }

  const bbsApplication = await db.prepare("SELECT id FROM applications WHERE company = ? AND role = ?")
    .bind("BBS I des Landkreises Gifhorn", "Theorielehrkraft Mathematik & Informatik")
    .first<{ id: number }>();
  if (bbsApplication?.id) {
    await db.prepare(`INSERT INTO application_updates (application_id, update_type, title, body, happened_on)
      SELECT ?, ?, ?, ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM application_updates WHERE application_id = ? AND title = ?)`)
      .bind(
        bbsApplication.id,
        "E-posta",
        "Bewerbungsbogen und Unterlagen versendet",
        "Unterschriebener EIS-Bewerbungsbogen und aktualisierte 18-seitige PDF-Unterlagen an die BBS I Gifhorn gesendet.",
        "2026-09-11",
        bbsApplication.id,
        "Bewerbungsbogen und Unterlagen versendet",
      )
      .run();
  }

  const applicationRows = await db.prepare("SELECT id, company, role FROM applications").all<{ id: number; company: string; role: string }>();
  const defaultSteps = ["İlanı ve şartları kontrol et", "CV ve Anschreiben uyarla", "Başvuruyu gönder", "Geri dönüşü kaydet"];
  for (const application of applicationRows.results) {
    const stepCount = await db.prepare("SELECT COUNT(*) AS count FROM application_steps WHERE application_id = ?").bind(application.id).first<{ count: number }>();
    if (!stepCount?.count) {
      await db.batch(defaultSteps.map((label, index) => db.prepare("INSERT INTO application_steps (application_id, label, sort_order) VALUES (?, ?, ?)").bind(application.id, label, index)));
    }
  }

  const taskCount = await db.prepare("SELECT COUNT(*) AS count FROM tasks").first<{ count: number }>();
  if (!taskCount?.count) {
    await db.batch([
      db.prepare("INSERT INTO tasks (title, category, estimate, sort_order) VALUES (?, ?, ?, ?)").bind("Takip tarihi gelen başvuruları kontrol et", "Takip", "10 dk", 1),
      db.prepare("INSERT INTO tasks (title, category, estimate, sort_order) VALUES (?, ?, ?, ?)").bind("En yüksek puanlı ilana CV'yi uyarlayıp gönder", "Başvuru", "45 dk", 2),
      db.prepare("INSERT INTO tasks (title, category, estimate, sort_order) VALUES (?, ?, ?, ?)").bind("Almanca mülakat cevabını sesli prova et", "Almanca", "20 dk", 3),
    ]);
  }
  return db;
}

export async function getDashboardData() {
  const db = await prepareDb();
  const career = await getCareerData();
  const [apps, tasks, updates, steps] = await Promise.all([
    db.prepare(`SELECT id, deleted_at AS deletedAt, company, role, track, location, score, status, deadline, url, notes, source, applied_on AS appliedOn, contact_name AS contactName, contact_email AS contactEmail, contact_phone AS contactPhone, last_contact_on AS lastContactOn, next_action AS nextAction, next_action_date AS nextActionDate, feedback
      FROM applications ORDER BY CASE status WHEN 'interview' THEN 1 WHEN 'offer' THEN 2 WHEN 'preparing' THEN 3 WHEN 'applied' THEN 4 WHEN 'saved' THEN 5 ELSE 6 END, COALESCE(next_action_date, deadline, applied_on, created_at) ASC`).all<Application>(),
    db.prepare("SELECT id, title, category, estimate, done FROM tasks ORDER BY done ASC, sort_order ASC, id ASC LIMIT 8").all<Task>(),
    db.prepare("SELECT id, application_id AS applicationId, update_type AS updateType, title, body, happened_on AS happenedOn FROM application_updates ORDER BY happened_on DESC, id DESC").all<{ id: number; applicationId: number; updateType: string; title: string; body: string | null; happenedOn: string }>(),
    db.prepare("SELECT id, application_id AS applicationId, label, done, sort_order AS sortOrder FROM application_steps ORDER BY application_id, sort_order, id").all<{ id: number; applicationId: number; label: string; done: number; sortOrder: number }>(),
  ]);

  return {
    career,
    applications: apps.results.map((application) => ({
      ...application,
      updates: updates.results.filter((item) => item.applicationId === application.id),
      steps: steps.results.filter((item) => item.applicationId === application.id),
    })),
    tasks: tasks.results,
  };
}

export async function addApplication(formData: FormData) {
  const db = await prepareDb();
  const candidate = { company: String(formData.get("company") || "").trim(), role: String(formData.get("role") || "").trim() };
  if (!candidate.company || !candidate.role) throw new Error("INVALID_INPUT");
  const existing = await db.prepare("SELECT company, role, notes FROM applications").all<{company: string; role: string; notes: string|null}>();
  if (existing.results.some(item => isDuplicate(item, candidate))) throw new Error("DUPLICATE_APPLICATION");
  const score = Math.max(0, Math.min(100, Number(formData.get("score")) || 50));
  const status = statuses.has(String(formData.get("status"))) ? String(formData.get("status")) : "saved";
  await db.prepare(`INSERT INTO applications (company, role, track, location, score, status, deadline, url, notes, source, applied_on, contact_name, contact_email, contact_phone, next_action, next_action_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      formData.get("company"), formData.get("role"), formData.get("track"), formData.get("location") || null, score,
      status, formData.get("deadline") || null, formData.get("url") || null, formData.get("notes") || null,
      formData.get("source") || null, formData.get("appliedOn") || null, formData.get("contactName") || null, formData.get("contactEmail") || null,
      formData.get("contactPhone") || null, formData.get("nextAction") || null, formData.get("nextActionDate") || null,
    ).run();
  revalidatePath("/");
}

export async function updateApplicationStatus(formData: FormData) {
  const db = await prepareDb();
  const status = String(formData.get("status"));
  if (!statuses.has(status)) return;
  const id = Number(formData.get("id"));
  await db.prepare("UPDATE applications SET status = ?, last_contact_on = CASE WHEN ? IN ('interview', 'offer') THEN CURRENT_DATE ELSE last_contact_on END WHERE id = ?").bind(status, status, id).run();
  await db.prepare("INSERT INTO application_updates (application_id, update_type, title, body) VALUES (?, 'Durum', ?, ?)").bind(id, `Durum: ${status}`, `Başvuru durumu ${status} olarak güncellendi.`).run();
  revalidatePath("/");
}

export async function updateApplicationStep(formData: FormData) {
  const db = await prepareDb();
  await db.prepare("UPDATE application_steps SET done = ? WHERE id = ?").bind(Number(formData.get("done")) ? 1 : 0, Number(formData.get("stepId"))).run();
  revalidatePath("/");
}

export async function addApplicationUpdate(formData: FormData) {
  const db = await prepareDb();
  const title = String(formData.get("title") || "Yeni güncelleme").trim();
  if (!title) return;
  const date = String(formData.get("happenedOn") || new Date().toISOString().slice(0, 10));
  await db.prepare("INSERT INTO application_updates (application_id, update_type, title, body, happened_on) VALUES (?, ?, ?, ?, ?)")
    .bind(Number(formData.get("applicationId")), formData.get("updateType") || "Not", title, formData.get("body") || null, date).run();
  await db.prepare("UPDATE applications SET feedback = ?, last_contact_on = ? WHERE id = ?")
    .bind(formData.get("body") || title, date, Number(formData.get("applicationId"))).run();
  revalidatePath("/");
}

export async function deleteApplication(formData: FormData) {
  const db = await prepareDb();
  const id = Number(formData.get("id"));
  await db.prepare("UPDATE applications SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL").bind(id).run();
  revalidatePath("/");
}

export async function restoreApplication(formData: FormData) {
  const db = await prepareDb();
  await db.prepare("UPDATE applications SET deleted_at = NULL WHERE id = ?").bind(Number(formData.get("id"))).run();
  revalidatePath("/");
}

export async function correctApplicationDate(formData: FormData) {
  const date = String(formData.get("appliedOn") || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new Error("INVALID_DATE");
  const db = await prepareDb();
  await db.prepare("UPDATE applications SET applied_on = ? WHERE id = ? AND deleted_at IS NULL").bind(date, Number(formData.get("id"))).run();
  revalidatePath("/");
}

export async function addTask(formData: FormData) {
  const db = await prepareDb();
  await db.prepare("INSERT INTO tasks (title, category, estimate, sort_order) VALUES (?, ?, ?, 10)").bind(formData.get("title"), formData.get("category") || "Kariyer", formData.get("estimate") || "30 dk").run();
  revalidatePath("/");
}

export async function updateTask(formData: FormData) {
  const db = await prepareDb();
  await db.prepare("UPDATE tasks SET done = ? WHERE id = ?").bind(Number(formData.get("done")) ? 1 : 0, Number(formData.get("id"))).run();
  revalidatePath("/");
}
