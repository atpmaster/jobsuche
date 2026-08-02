"use server";

import { env } from "cloudflare:workers";
import { revalidatePath } from "next/cache";

type Application = { id: number; company: string; role: string; track: string; location: string | null; score: number; status: string; deadline: string | null; url: string | null; notes: string | null };
type Task = { id: number; title: string; category: string; estimate: string; done: number };

async function prepareDb() {
  const db = env.DB;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS applications (id INTEGER PRIMARY KEY AUTOINCREMENT, company TEXT NOT NULL, role TEXT NOT NULL, track TEXT NOT NULL DEFAULT 'other', location TEXT, score INTEGER NOT NULL DEFAULT 50 CHECK(score BETWEEN 0 AND 100), status TEXT NOT NULL DEFAULT 'saved', deadline TEXT, url TEXT, notes TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'Kariyer', estimate TEXT NOT NULL DEFAULT '30 dk', done INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_tasks_done_sort ON tasks(done, sort_order)`),
  ]);
  const count = await db.prepare("SELECT COUNT(*) AS count FROM applications").first<{ count: number }>();
  if (!count?.count) {
    await db.batch([
      db.prepare("INSERT INTO applications (company, role, track, location, score, status, deadline, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind("Stadt Wolfsburg", "Mathematiklehrer / Seiteneinstieg", "teaching", "Wolfsburg", 91, "preparing", "2026-08-08", "ZAB ve pedagojik formasyon güçlü eşleşme"),
      db.prepare("INSERT INTO applications (company, role, track, location, score, status, deadline, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind("IT-Sicherheitsunternehmen", "Junior SOC Analyst", "cyber", "Braunschweig", 84, "saved", "2026-08-12", "Security+ ve Almanya stajı öne çıkarılmalı"),
      db.prepare("INSERT INTO applications (company, role, track, location, score, status, deadline, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind("Bildungsträger Gifhorn", "Dozent Mathematik", "teaching", "Gifhorn", 78, "applied", "2026-08-05", "Yakın konum ve hızlı başlangıç avantajı"),
    ]);
  }
  const taskCount = await db.prepare("SELECT COUNT(*) AS count FROM tasks").first<{ count: number }>();
  if (!taskCount?.count) {
    await db.batch([
      db.prepare("INSERT INTO tasks (title, category, estimate, sort_order) VALUES (?, ?, ?, ?)").bind("En yüksek puanlı ilana CV'yi uyarlayıp gönder", "Başvuru", "45 dk", 1),
      db.prepare("INSERT INTO tasks (title, category, estimate, sort_order) VALUES (?, ?, ?, ?)").bind("Bir öğretmenlik ilanını sisteme ekle ve puanla", "Araştırma", "30 dk", 2),
      db.prepare("INSERT INTO tasks (title, category, estimate, sort_order) VALUES (?, ?, ?, ?)").bind("Almanca mülakat cevabını sesli prova et", "Almanca", "20 dk", 3),
    ]);
  }
  return db;
}

export async function getDashboardData() {
  const db = await prepareDb();
  const [apps, tasks] = await Promise.all([
    db.prepare("SELECT id, company, role, track, location, score, status, deadline, url, notes FROM applications ORDER BY CASE status WHEN 'interview' THEN 1 WHEN 'preparing' THEN 2 WHEN 'saved' THEN 3 WHEN 'applied' THEN 4 ELSE 5 END, score DESC").all<Application>(),
    db.prepare("SELECT id, title, category, estimate, done FROM tasks ORDER BY done ASC, sort_order ASC, id ASC LIMIT 8").all<Task>(),
  ]);
  return { applications: apps.results, tasks: tasks.results };
}

export async function addApplication(formData: FormData) {
  const db = await prepareDb();
  const score = Math.max(0, Math.min(100, Number(formData.get("score")) || 50));
  await db.prepare("INSERT INTO applications (company, role, track, location, score, status, deadline, url, notes) VALUES (?, ?, ?, ?, ?, 'saved', ?, ?, ?)").bind(formData.get("company"), formData.get("role"), formData.get("track"), formData.get("location") || null, score, formData.get("deadline") || null, formData.get("url") || null, formData.get("notes") || null).run();
  revalidatePath("/");
}

export async function updateApplicationStatus(formData: FormData) {
  const db = await prepareDb();
  const status = String(formData.get("status"));
  if (!new Set(["saved", "preparing", "applied", "interview", "offer", "rejected"]).has(status)) return;
  await db.prepare("UPDATE applications SET status = ? WHERE id = ?").bind(status, Number(formData.get("id"))).run();
  revalidatePath("/");
}

export async function deleteApplication(formData: FormData) {
  const db = await prepareDb();
  await db.prepare("DELETE FROM applications WHERE id = ?").bind(Number(formData.get("id"))).run();
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
