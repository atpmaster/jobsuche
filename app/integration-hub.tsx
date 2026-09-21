"use client";

import { useMemo, useState } from "react";
import { addApplication } from "./actions";
import type { Application } from "./dashboard";
import type { CareerData } from "./career-tools";

function draftFor(application: Application, language: "tr" | "de") {
  const de = language === "de";
  return {
    subject: de ? `Nachfrage zu meiner Bewerbung – ${application.role}` : `Başvurum hakkında – ${application.role}`,
    body: de
      ? `Sehr geehrte Damen und Herren,\n\n${application.appliedOn || "[Datum]"} habe ich mich bei ${application.company} für die Position „${application.role}“ beworben. Ich möchte mich höflich nach dem aktuellen Stand meiner Bewerbung erkundigen.\n\nFalls Sie weitere Unterlagen benötigen, reiche ich diese gerne nach.\n\nMit freundlichen Grüßen\nAhmet Tepe`
      : `Sayın Yetkili,\n\n${application.appliedOn || "[Tarih]"} tarihinde ${application.company} kurumundaki ${application.role} pozisyonuna başvurdum. Başvurumun güncel durumu hakkında bilgi rica ederim.\n\nİhtiyaç duyduğunuz ek belgeleri iletmekten memnuniyet duyarım.\n\nSaygılarımla,\nAhmet Tepe`,
  };
}

async function readResponse(response: Response) {
  const data = await response.json().catch(() => ({})) as { ok?: boolean; error?: string; reconnect?: boolean; url?: string; folderUrl?: string; fileUrl?: string; uploaded?: boolean };
  if (!response.ok || data.error) throw new Error(data.reconnect ? "RECONNECT" : data.error || "INTEGRATION_FAILED");
  return data;
}

export function IntegrationHub({ applications, career, language, gmailConnected }: { applications: Application[]; career: CareerData; language: "tr" | "de"; gmailConnected: boolean }) {
  const active = applications.filter((application) => !application.deletedAt);
  const [selectedId, setSelectedId] = useState(String(active[0]?.id || ""));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [subject, setSubject] = useState(() => active[0] ? draftFor(active[0], language).subject : "");
  const [body, setBody] = useState(() => active[0] ? draftFor(active[0], language).body : "");
  const [driveFile, setDriveFile] = useState<File | null>(null);
  const [jobUrl, setJobUrl] = useState("");
  const [jobDraft, setJobDraft] = useState<{ company: string; role: string; source: string; url: string } | null>(null);
  const selected = active.find((application) => String(application.id) === selectedId) || active[0];
  const interviewIds = useMemo(() => new Set(career.interviews.map((event) => event.applicationId)), [career.interviews]);
  const de = language === "de";
  const selectApplication = (value: string) => {
    setSelectedId(value);
    const next = active.find((application) => String(application.id) === value);
    const draft = next ? draftFor(next, language) : { subject: "", body: "" };
    setSubject(draft.subject); setBody(draft.body); setMessage("");
  };
  const showError = (error: unknown) => setMessage(error instanceof Error && error.message === "RECONNECT" ? (de ? "Bitte Gmail erneut verbinden, um Kalender, Drive und Entwürfe zu aktivieren." : "Takvim, Drive ve taslakları etkinleştirmek için Gmail hesabını yeniden bağla.") : (de ? "Aktion konnte nicht abgeschlossen werden." : "İşlem tamamlanamadı."));
  const calendar = async () => {
    if (!selected) return;
    setBusy("calendar"); setMessage("");
    try { const response = await fetch("/api/integrations/calendar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ applicationId: selected.id }) }); const data = await readResponse(response); setMessage(data.url ? (de ? "Kalendertermin aktualisiert." : "Takvim etkinliği güncellendi.") : (de ? "Kalendertermin gespeichert." : "Takvim etkinliği kaydedildi.")); } catch (error) { showError(error); } finally { setBusy(""); }
  };
  const drive = async () => {
    if (!selected) return;
    setBusy("drive"); setMessage("");
    try { const form = new FormData(); form.set("applicationId", String(selected.id)); if (driveFile) { form.set("file", driveFile); form.set("fileName", driveFile.name); } const response = await fetch("/api/integrations/drive", { method: "POST", body: form }); const data = await readResponse(response); setMessage(data.uploaded ? (de ? "PDF im Drive gespeichert." : "PDF Drive'a kaydedildi.") : (de ? "Drive-Ordner bereit." : "Drive klasörü hazır.")); if (data.folderUrl) window.open(data.folderUrl, "_blank", "noopener,noreferrer"); setDriveFile(null); } catch (error) { showError(error); } finally { setBusy(""); }
  };
  const draft = async () => {
    if (!selected) return;
    setBusy("draft"); setMessage("");
    try { const response = await fetch("/api/integrations/gmail-draft", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ applicationId: selected.id, subject, body }) }); const data = await readResponse(response); setMessage(de ? "Gmail-Entwurf erstellt." : "Gmail taslağı oluşturuldu."); if (data.url) window.open(data.url, "_blank", "noopener,noreferrer"); } catch (error) { showError(error); } finally { setBusy(""); }
  };
  const label = async () => {
    if (!selected) return;
    setBusy("label"); setMessage("");
    try { const response = await fetch("/api/integrations/gmail-label", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ applicationId: selected.id }) }); await readResponse(response); setMessage(de ? "Gmail-Label aktualisiert." : "Gmail etiketi güncellendi."); } catch (error) { showError(error); } finally { setBusy(""); }
  };
  const analyzeJob = async () => {
    setBusy("job"); setMessage("");
    try { const response = await fetch("/api/job-url", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: jobUrl }) }); const data = await readResponse(response) as { company: string; role: string; source: string; url: string }; setJobDraft(data); setMessage(de ? "Stelle erkannt. Angaben prüfen und speichern." : "İlan bulundu. Bilgileri kontrol edip kaydedebilirsin."); } catch (error) { showError(error); } finally { setBusy(""); }
  };
  const saveJob = async () => {
    if (!jobDraft) return;
    setBusy("job-save"); setMessage("");
    try { const form = new FormData(); Object.entries({ company: jobDraft.company, role: jobDraft.role, track: "other", score: "70", status: "new", source: jobDraft.source, url: jobDraft.url, location: "", appliedOn: "", nextActionDate: "", nextAction: "", contactName: "", contactEmail: "", contactPhone: "", notes: "" }).forEach(([key, value]) => form.set(key, value)); await addApplication(form); setMessage(de ? "Bewerbung gespeichert." : "Başvuru kaydedildi."); setJobDraft(null); setJobUrl(""); } catch (error) { showError(error); } finally { setBusy(""); }
  };
  const copy = de ? { title: "Bağlantılar", hint: "Başvuru kaydını Calendar, Drive ve Gmail ile eşleştir.", choose: "Başvuru", calendar: "Google Calendar'a ekle", drive: "Drive klasörü aç", draft: "Gmail taslağı oluştur", job: "İlan URL'si yakala", read: "İlanı oku", save: "Başvuruyu kaydet", connected: "Gmail bağlantısı hazır", reconnect: "Gmail'i yeniden bağla", interview: "Mülakat kaydı bulunamadı." } : { title: "Entegrasyonlar", hint: "Başvuru kaydını Calendar, Drive ve Gmail ile eşleştir.", choose: "Başvuru", calendar: "Google Calendar'a ekle", drive: "Drive klasörü aç", draft: "Gmail taslağı oluştur", job: "İlan URL'si yakala", read: "İlanı oku", save: "Başvuruyu kaydet", connected: "Gmail bağlantısı hazır", reconnect: "Gmail'i yeniden bağla", interview: "Bu başvuru için mülakat kaydı bulunamadı." };
  return <section className="integration-hub career-tools" aria-label={copy.title}><details open><summary>{copy.title}</summary><p>{copy.hint}</p>{!gmailConnected && <p className="integration-warning">{de ? "Gmail bağlantısı olmadan Google entegrasyonları çalışmaz." : "Google entegrasyonları için önce Gmail hesabını bağla."} <a href="/api/gmail/connect">{copy.reconnect}</a></p>}{gmailConnected && <p className="integration-scope-note">{de ? "İlk kullanımda yeni Google izinlerini etkinleştirmek için hesabı yeniden bağla." : "İlk kullanımda yeni Google izinlerini etkinleştirmek için Gmail hesabını bir kez yeniden bağla."} <a href="/api/gmail/connect">{copy.reconnect}</a></p>}<label>{copy.choose}<select value={selected ? String(selected.id) : ""} onChange={(event) => selectApplication(event.target.value)}>{active.map((application) => <option key={application.id} value={application.id}>{application.company} — {application.role}</option>)}</select></label>{selected && <div className="integration-grid"><div className="integration-card"><strong>Google Calendar</strong><small>{interviewIds.has(selected.id) ? (de ? "Mülakat tarihi hazır" : "Mülakat tarihi hazır") : copy.interview}</small>{selected.calendarEventUrl ? <a href={selected.calendarEventUrl} target="_blank" rel="noreferrer">{de ? "Termin öffnen ↗" : "Etkinliği aç ↗"}</a> : <button type="button" onClick={calendar} disabled={busy === "calendar" || !interviewIds.has(selected.id)}>{busy === "calendar" ? "…" : copy.calendar}</button>}</div><div className="integration-card"><strong>Google Drive</strong><small>{selected.driveFolderUrl ? (de ? "Ordner verbunden" : "Klasör bağlı") : (de ? "Bewerbungsordner" : "Başvuru klasörü")}</small><input type="file" accept="application/pdf,.pdf" onChange={(event) => setDriveFile(event.target.files?.[0] || null)} />{selected.driveFolderUrl ? <a href={selected.driveFolderUrl} target="_blank" rel="noreferrer">{de ? "Ordner öffnen ↗" : "Klasörü aç ↗"}</a> : null}<button type="button" onClick={drive} disabled={busy === "drive"}>{busy === "drive" ? "…" : driveFile ? (de ? "PDF im Drive speichern" : "PDF'yi Drive'a kaydet") : copy.drive}</button></div><div className="integration-card integration-draft"><strong>Gmail taslak</strong><small>{copy.connected}</small><input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder={de ? "Betreff" : "Konu"} /><textarea rows={4} value={body} onChange={(event) => setBody(event.target.value)} placeholder={de ? "Entwurf" : "Taslak"} /><button type="button" onClick={draft} disabled={busy === "draft" || !subject || !body}>{busy === "draft" ? "…" : copy.draft}</button></div><div className="integration-card"><strong>Gmail etiket</strong><small>{de ? "Status im Gmail-Thread" : "Durumu Gmail thread'ine yazar"}</small><button type="button" onClick={label} disabled={busy === "label" || !selected.gmailThreadId}>{busy === "label" ? "…" : (de ? "Label aktualisieren" : "Etiketi güncelle")}</button></div></div>}{message && <p role="status">{message}</p>}</details><details><summary>{copy.job}</summary><p>{de ? "Arbeitsagentur, Indeed, LinkedIn, StepStone und XING bağlantılarını başvuru taslağına dönüştür." : "Arbeitsagentur, Indeed, LinkedIn, StepStone ve XING bağlantılarını başvuru taslağına dönüştür."}</p><div className="integration-url-row"><input type="url" value={jobUrl} onChange={(event) => setJobUrl(event.target.value)} placeholder="https://…" /><button type="button" onClick={analyzeJob} disabled={busy === "job" || !jobUrl}>{busy === "job" ? "…" : copy.read}</button></div>{jobDraft && <div className="job-capture-result"><label>{de ? "Arbeitgeber" : "Şirket / kurum"}<input value={jobDraft.company} onChange={(event) => setJobDraft({ ...jobDraft, company: event.target.value })} /></label><label>{de ? "Position" : "Pozisyon"}<input value={jobDraft.role} onChange={(event) => setJobDraft({ ...jobDraft, role: event.target.value })} /></label><small>{jobDraft.source} · {jobDraft.url}</small><button type="button" onClick={saveJob} disabled={busy === "job-save"}>{busy === "job-save" ? "…" : copy.save}</button></div>}</details></section>;
}
