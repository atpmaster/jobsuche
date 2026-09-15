"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { addApplication, addApplicationUpdate, addTask, deleteApplication, updateApplicationRecord, updateApplicationStatus, updateApplicationStep, updateTask } from "./actions";
import { CareerTools, type CareerData } from "./career-tools";
import { DateEditor } from "./date-editor";
import { useRouter } from "next/navigation";
import { isDuplicate, normalize } from "./record-utils";
import { restoreApplication } from "./actions";
import { LiveRefresh } from "./live-refresh";
import { localizedContent, localizedSource, statusLabels, type Language } from "./localization";

type Step = { id: number; label: string; done: number };
type Update = { id: number; updateType: string; title: string; body: string | null; happenedOn: string };
export type Application = {
  deletedAt?: string | null;
  id: number; company: string; role: string; track: string; location: string | null; score: number; status: string;
  deadline: string | null; url: string | null; notes: string | null; source: string | null; appliedOn: string | null;
  contactName: string | null; contactEmail: string | null; contactPhone: string | null; lastContactOn: string | null;
  nextAction: string | null; nextActionDate: string | null; feedback: string | null; gmailMessageId?: string | null; steps: Step[]; updates: Update[];
};
type Task = { id: number; title: string; category: string; estimate: string; done: number };
type DashboardProps = { applications: Application[]; tasks: Task[]; today: string; career: CareerData; gmailConnected: boolean };

const copy = {
  tr: {
    languageName: "Türkçe", languageShort: "TR", area: "Çalışma alanı", files: "Dosyalar", followUp: "Takip", tasks: "Görevler", journal: "Günlük", live: "Canlı kayıt", lastCheck: "Son kontrol", searchArea: "İş arama", title: "Başvuru dosyaları", intro: "İlanları, görüşmeleri ve sıradaki adımları tek yerde tut.", newApplication: "Yeni başvuru", addToFile: "Dosyaya ekle", newOpportunity: "Yeni fırsat", saveOpportunityHint: "Takipte kalmak istediğin ilanı kaydet.", openFiles: "Açık dosyalar", open: "açık", awaiting: "yanıt bekleyen", advanced: "ileri aşama", due: "takip gereken", averageMatch: "ort. uyum", records: "Kayıtlar", applications: "Başvurular", clickToOpen: "Açmak için satıra tıkla", number: "No", jobCompany: "İlan / kurum", source: "Kaynak", status: "Durum", followUpColumn: "Takip", noDate: "Tarih yok", noLocation: "Konum belirtilmedi", noSource: "Manuel kayıt", noNextAction: "Sonraki adım eklenmedi", noContact: "Henüz eklenmedi", noContactInfo: "İletişim bilgisi yok", noFeedback: "Henüz geri dönüş yok", noNote: "Not eklenmedi", updateStatus: "Durumu güncelle", save: "Kaydet", openListing: "İlanı aç", contact: "Muhatap", lastContact: "Son temas", feedback: "Son geri dönüş", steps: "Başvuru adımları", completed: "tamamlandı", timeline: "Zaman çizelgesi", recent: "Son hareketler", noUpdates: "Durum değişikliği veya not eklendiğinde burada görünecek.", updateTitle: "Yeni hareket başlığı", updateBody: "Kısa not veya alınan yanıt", addUpdate: "Güncelleme ekle", delete: "Çöp kutusuna taşı", priority: "Öncelikli dosya", tracking: "Takip", noPlan: "Planlanmadı", nextStep: "Sonraki adım", lastNote: "Son not", goToDetails: "Dosya ayrıntılarına git", today: "Bugün", noFile: "Henüz dosya yok.", noFileHint: "İlk başvurunu eklediğinde ayrıntıları burada göreceksin.", todo: "Yapılacaklar", addTask: "Yeni görev ekle", add: "Ekle", pdf: "PDF’yi aç", pdfHint: "Jobcenter raporu", pdfTitle: "Jobcenter için başvuru özeti", pdfSubtitle: "Ahmet Tepe - başvuru listesi ve güncel durum", generated: "Oluşturulma tarihi", notes: "Not", applicationDate: "Başvuru tarihi", employer: "Kurum / pozisyon", reportStatus: "Güncel durum", reportNext: "Sıradaki adım", reportSource: "Başvuru kaynağı", reportContact: "Muhatap", reportFooter: "Bu rapor, başvuru takibi amacıyla hazırlanmıştır.", all: "Tümü", education: "Eğitim", cyber: "Siber güvenlik", other: "Alternatif", check: "kontrol et", adjust: "uyarla", send: "gönder", record: "kaydet", tomorrow: "Yarın", daysAfter: "gün sonra", daysLate: "gün gecikti", queueClear: "kuyruk temiz", prioritize: "öncelik ver", selectedLanguage: "Dil", followUpAlerts: "Takip uyarıları", followUpHint: "Yanıt veya sonraki adım için kontrol zamanı geldi.", viewFile: "Dosyayı aç", dismiss: "Kapat", dismissAll: "Tümünü kapat", restoreDismissed: "Kapatılanları göster"
  },
  de: {
    languageName: "Deutsch", languageShort: "DE", area: "Arbeitsbereich", files: "Dateien", followUp: "Nachfassen", tasks: "Aufgaben", journal: "Journal", live: "Live gespeichert", lastCheck: "Letzte Prüfung", searchArea: "Bewerbungen", title: "Bewerbungsdateien", intro: "Stellen, Gespräche und nächste Schritte an einem Ort.", newApplication: "Neue Bewerbung", addToFile: "Zur Datei hinzufügen", newOpportunity: "Neue Stelle", saveOpportunityHint: "Eine interessante Stelle für die Nachverfolgung speichern.", openFiles: "Offene Dateien", open: "offen", awaiting: "Rückmeldung ausstehend", advanced: "in weiterem Prozess", due: "Nachfassen nötig", averageMatch: "Ø Passung", records: "Einträge", applications: "Bewerbungen", clickToOpen: "Zum Öffnen auf eine Zeile klicken", number: "Nr.", jobCompany: "Stelle / Arbeitgeber", source: "Quelle", status: "Status", followUpColumn: "Nachfassen", noDate: "Kein Datum", noLocation: "Ort nicht angegeben", noSource: "Manueller Eintrag", noNextAction: "Kein nächster Schritt", noContact: "Noch nicht ergänzt", noContactInfo: "Keine Kontaktdaten", noFeedback: "Noch keine Rückmeldung", noNote: "Keine Notiz", updateStatus: "Status aktualisieren", save: "Speichern", openListing: "Stelle öffnen", contact: "Kontakt", lastContact: "Letzter Kontakt", feedback: "Letzte Rückmeldung", steps: "Bewerbungsschritte", completed: "erledigt", timeline: "Zeitleiste", recent: "Letzte Aktivitäten", noUpdates: "Statusänderungen und Notizen erscheinen hier.", updateTitle: "Titel der Aktivität", updateBody: "Kurze Notiz oder erhaltene Antwort", addUpdate: "Aktivität hinzufügen", delete: "In den Papierkorb", priority: "Priorisierte Datei", tracking: "Nachfassen", noPlan: "Nicht geplant", nextStep: "Nächster Schritt", lastNote: "Letzte Notiz", goToDetails: "Dateidetails öffnen", today: "Heute", noFile: "Noch keine Datei.", noFileHint: "Nach dem Hinzufügen einer Bewerbung erscheinen die Details hier.", todo: "Aufgaben", addTask: "Neue Aufgabe hinzufügen", add: "Hinzufügen", pdf: "PDF öffnen", pdfHint: "Jobcenter-Bericht", pdfTitle: "Bewerbungsübersicht für das Jobcenter", pdfSubtitle: "Ahmet Tepe - Bewerbungsliste und aktueller Stand", generated: "Erstellt am", notes: "Notiz", applicationDate: "Bewerbung am", employer: "Arbeitgeber / Stelle", reportStatus: "Aktueller Status", reportNext: "Nächster Schritt", reportSource: "Quelle", reportContact: "Kontakt", reportFooter: "Dieser Bericht wurde zur Dokumentation der Bewerbungsaktivitäten erstellt.", all: "Alle", education: "Bildung", cyber: "Cybersecurity", other: "Sonstige", check: "prüfen", adjust: "anpassen", send: "senden", record: "dokumentieren", tomorrow: "Morgen", daysAfter: "Tage", daysLate: "Tage überfällig", queueClear: "keine offenen Nachfassungen", prioritize: "Priorität geben", selectedLanguage: "Sprache", followUpAlerts: "Nachfass-Erinnerungen", followUpHint: "Die nächste Prüfung oder Rückmeldung ist fällig.", viewFile: "Datei öffnen", dismiss: "Schließen", dismissAll: "Alle schließen", restoreDismissed: "Geschlossene anzeigen"
  }
} as const;

const statusOrder = ["new", "listed", "sent", "waiting", "received"];
const trackLabels: Record<Language, Record<string, string>> = { tr: { teaching: "Eğitim", cyber: "Siber güvenlik", other: "Alternatif" }, de: { teaching: "Bildung", cyber: "Cybersecurity", other: "Sonstige" } };
const updateTypeOptions: Record<Language, Array<{ value: string; label: string }>> = { tr: [{ value: "Not", label: "Not" }, { value: "E-posta", label: "E-posta" }, { value: "Telefon", label: "Telefon" }, { value: "Mülakat", label: "Mülakat" }, { value: "Durum", label: "Durum" }], de: [{ value: "Notiz", label: "Notiz" }, { value: "E-Mail", label: "E-Mail" }, { value: "Telefon", label: "Telefon" }, { value: "Vorstellungsgespräch", label: "Vorstellungsgespräch" }, { value: "Status", label: "Status" }] };
const statusForLanguage = (language: Language) => statusLabels[language];

function formatDate(value: string | null | undefined, language: Language, long = false) {
  if (!value) return copy[language].noDate;
  return new Intl.DateTimeFormat(language === "de" ? "de-DE" : "tr-TR", { day: "2-digit", month: long ? "long" : "short", year: long ? "numeric" : undefined }).format(new Date(`${value}T12:00:00`));
}

function daysUntil(value: string | null | undefined, today: string) {
  if (!value) return null;
  return Math.round((Date.parse(`${value}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86400000);
}

function relativeDate(value: string | null | undefined, today: string, language: Language) {
  const days = daysUntil(value, today);
  const t = copy[language];
  if (days === null) return t.noPlan;
  if (days < 0) return `${Math.abs(days)} ${t.daysLate}`;
  if (days === 0) return t.today;
  if (days === 1) return language === "de" ? t.tomorrow : t.tomorrow;
  return language === "de" ? `${days} ${t.daysAfter}` : `${days} ${t.daysAfter}`;
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function localizedStep(label: string, language: Language) {
  const translations: Record<string, Record<Language, string>> = {
    "İlanı ve şartları kontrol et": { tr: "İlanı ve şartları kontrol et", de: "Stellenanzeige und Anforderungen prüfen" },
    "CV ve Anschreiben uyarla": { tr: "CV ve ön yazıyı uyarla", de: "CV und Anschreiben anpassen" },
    "Başvuruyu gönder": { tr: "Başvuruyu gönder", de: "Bewerbung versenden" },
    "Geri dönüşü kaydet": { tr: "Geri dönüşü kaydet", de: "Rückmeldung dokumentieren" },
  };
  return translations[label]?.[language] ?? label;
}

function localizedTask(value: string, language: Language) {
  const translations: Record<string, Record<Language, string>> = {
    "Takip tarihi gelen başvuruları kontrol et": { tr: value, de: "Bewerbungen mit fälligem Nachfassen prüfen" },
    "En yüksek puanlı ilana CV'yi uyarlayıp gönder": { tr: value, de: "CV auf passendste Stelle anpassen und senden" },
    "Almanca mülakat cevabını sesli prova et": { tr: value, de: "Antwort für Vorstellungsgespräch auf Deutsch üben" },
  };
  return translations[value]?.[language] ?? value;
}

function localizedCategory(value: string, language: Language) {
  if (language === "tr") return value;
  return { Takip: "Nachfassen", Başvuru: "Bewerbung", Almanca: "Deutsch", Kariyer: "Karriere" }[value] ?? value;
}

function isReportNoise(application: Application) {
  const feedback = application.feedback ?? "";
  return feedback.startsWith("Mükerrer Gmail kaydı;") || feedback.startsWith("Gelen cevap; ayrı bir başvuru değil.") || feedback.startsWith("Kein Bewerbungsvorgang:");
}

const dismissedFollowUpsKey = "application-follow-up-dismissed";
const dismissedFollowUpSubscribers = new Set<() => void>();

function subscribeToDismissedFollowUps(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  dismissedFollowUpSubscribers.add(onStoreChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === dismissedFollowUpsKey) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    dismissedFollowUpSubscribers.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getDismissedFollowUpsSnapshot() {
  return typeof window === "undefined" ? "" : window.localStorage.getItem(dismissedFollowUpsKey) ?? "";
}

function getServerDismissedFollowUpsSnapshot() {
  return "";
}

function useDismissedFollowUps() {
  const serialized = useSyncExternalStore(subscribeToDismissedFollowUps, getDismissedFollowUpsSnapshot, getServerDismissedFollowUpsSnapshot);
  const dismissed = useMemo(() => new Set(serialized.split(",").filter(Boolean)), [serialized]);

  const persist = (next: Set<string>) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(dismissedFollowUpsKey, Array.from(next).join(","));
    dismissedFollowUpSubscribers.forEach((subscriber) => subscriber());
  };

  return {
    dismissed,
    dismiss: (key: string) => persist(new Set(dismissed).add(key)),
    dismissAll: (keys: string[]) => persist(new Set([...dismissed, ...keys])),
    restoreAll: () => persist(new Set()),
  };
}

function followUpKey(application: Application) {
  return `${application.id}:${application.nextActionDate ?? ""}`;
}

function ApplicationAuditEditor({ item, language }: { item: Application; language: Language }) {
  const de = language === "de";
  return <details className="audit-editor"><summary>{de ? "Berichtsfelder prüfen und korrigieren" : "Rapor alanlarını kontrol et ve düzelt"}: {item.company} — {item.role}</summary><form action={updateApplicationRecord} className="audit-form">
    <input type="hidden" name="id" value={item.id} />
    <div className="form-row"><label>{de ? "Arbeitgeber" : "Kurum"}<input name="company" required defaultValue={item.company} /></label><label>{de ? "Position" : "Pozisyon"}<input name="role" required defaultValue={item.role} /></label></div>
    <div className="form-row"><label>{de ? "Bereich" : "Alan"}<select name="track" defaultValue={item.track}><option value="teaching">{de ? "Bildung" : "Eğitim"}</option><option value="cyber">{de ? "Cybersecurity" : "Siber güvenlik"}</option><option value="other">{de ? "Sonstige" : "Alternatif"}</option></select></label><label>{de ? "Status" : "Durum"}<select name="status" defaultValue={item.status}>{statusOrder.map(status => <option key={status} value={status}>{statusLabels[language][status]}</option>)}</select></label></div>
    <div className="form-row"><label>{de ? "Ort" : "Konum"}<input name="location" defaultValue={item.location || ""} /></label><label>{de ? "Passung" : "Uyum"}<input name="score" type="number" min="0" max="100" defaultValue={item.score} /></label></div>
    <div className="form-row"><label>{de ? "Bewerbung am" : "Başvuru tarihi"}<input name="appliedOn" type="date" defaultValue={item.appliedOn || ""} /></label><label>{de ? "Nachfassen am" : "Takip tarihi"}<input name="nextActionDate" type="date" defaultValue={item.nextActionDate || ""} /></label></div>
    <div className="form-row"><label>{de ? "Quelle" : "Kaynak"}<input name="source" defaultValue={localizedSource(item.source, language) || ""} /></label><label>{de ? "Kontaktname" : "Muhatap"}<input name="contactName" defaultValue={item.contactName || ""} /></label></div>
    <div className="form-row"><label>{de ? "Kontakt-E-Mail" : "Muhatap e-postası"}<input name="contactEmail" type="email" defaultValue={item.contactEmail || ""} /></label><label>{de ? "Nächster Schritt" : "Sonraki adım"}<input name="nextAction" defaultValue={localizedContent(item.nextAction, language) || ""} /></label></div>
    <label>{de ? "Interne Notiz" : "İç not"}<textarea name="notes" defaultValue={localizedContent(item.notes, language) || ""} /></label>
    <label>{de ? "Kurze Rückmeldung für den Bericht" : "Rapor için kısa geri dönüş"}<textarea name="feedback" defaultValue={localizedContent(item.feedback, language) || ""} /></label>
    <button type="submit">{de ? "Berichtsdaten speichern" : "Rapor bilgilerini kaydet"}</button>
  </form></details>;
}

export function Dashboard({ applications: allApplications, tasks, today, career, gmailConnected }: DashboardProps) {
  const [language, setLanguage] = useState<Language>("tr");
  const applications = allApplications.filter(item => !item.deletedAt && !isReportNoise(item)).map(item => {
    const sources=allApplications.filter(a=>career.merges.some(m=>m.sourceId===a.id&&m.targetId===item.id));
    const dates=[item,...sources].map(a=>a.appliedOn).filter((d):d is string=>!!d).sort();
  return {...item,source: localizedSource(item.source, language),appliedOn:dates[0]||null,updates:[...item.updates,...sources.flatMap(a=>a.updates)].sort((a,b)=>b.happenedOn.localeCompare(a.happenedOn)),steps:[...item.steps,...sources.flatMap(a=>a.steps)].filter((step,index,all)=>all.findIndex(s=>s.label===step.label)===index).map(step=>({...step,done:Math.max(...[...item.steps,...sources.flatMap(a=>a.steps)].filter(s=>s.label===step.label).map(s=>s.done))}))};
  }).sort((a, b) => {
    if (!a.appliedOn && !b.appliedOn) return 0;
    if (!a.appliedOn) return 1;
    if (!b.appliedOn) return -1;
    return b.appliedOn.localeCompare(a.appliedOn) || b.id - a.id;
  });
  const trash = allApplications.filter(item => item.deletedAt && !career.merges.some(m=>m.sourceId===item.id));
  const [customerNumber,setCustomerNumber]=useState("");
  const [signature,setSignature]=useState(false);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTrack, setFilterTrack] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const { dismissed, dismiss, dismissAll, restoreAll } = useDismissedFollowUps();
  const t = copy[language];
  const statuses = statusForLanguage(language);
  const locale = language === "de" ? "de-DE" : "tr-TR";
  const todayLabel = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${today}T12:00:00`));
  const openStatuses = new Set(["new", "listed", "sent", "waiting"]);
  const active = applications.filter((item) => openStatuses.has(item.status));
  const awaiting = applications.filter((item) => item.status === "waiting");
  const inMotion = applications.filter((item) => item.status === "received");
  const followUps = applications.filter((item) => item.nextActionDate && item.nextActionDate <= today && openStatuses.has(item.status) && !dismissed.has(followUpKey(item)));
  const completedTasks = tasks.filter((task) => task.done).length;
  const avgScore = applications.length ? Math.round(applications.reduce((sum, item) => sum + item.score, 0) / applications.length) : 0;
  const priority = followUps[0] ?? [...active].sort((a, b) => b.score - a.score)[0];
  const recentUpdates = applications.flatMap((application) => application.updates.map((update) => ({ ...update, applicationName: application.company, applicationId: application.id }))).sort((a, b) => b.happenedOn.localeCompare(a.happenedOn)).slice(0, 5);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = language === "de" ? "Bewerbungszentrum | Ahmet Tepe" : "Başvuru Takip Merkezi | Ahmet Tepe";
  }, [language]);

  const changeLanguage = (next: Language) => setLanguage(next);
  const filtered = applications.filter(item => (!query || normalize([item.company,item.role,item.location].join(" ")).includes(normalize(query))) && (!filterStatus || item.status === filterStatus) && (!filterTrack || item.track === filterTrack) && (!dateFrom || !!item.appliedOn && item.appliedOn >= dateFrom) && (!dateTo || !!item.appliedOn && item.appliedOn <= dateTo));
  const reportApplications = filtered;
  const invalidRange = !!dateFrom && !!dateTo && dateFrom > dateTo;
  const exportBackup = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({schemaVersion:1, exportedAt:new Date().toISOString(), applications:allApplications,tasks,career},null,2)],{type:"application/json"}));
    const a=document.createElement("a"); a.href=url; a.download=`Ahmet-Tepe-backup-${today}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const saveApplication = async (data: FormData) => {
    setSaveError("");
    const candidate={company:String(data.get("company")||""),role:String(data.get("role")||"")};
    if(allApplications.some(item=>isDuplicate(item,candidate))) {setSaveError(language==="de"?"Diese Bewerbung existiert bereits. Bitte vorhandenen Eintrag oder Papierkorb prüfen.":"Bu başvuru zaten var. Mevcut kaydı veya çöp kutusunu kontrol et."); return;}
    setSaving(true);
    try { await addApplication(data); router.refresh(); document.querySelector<HTMLDetailsElement>(".add-menu")?.removeAttribute("open"); }
    catch {setSaveError(language==="de"?"Nicht gespeichert. Möglichen Doppeleintrag prüfen und erneut versuchen.":"Kaydedilemedi. Tekrarlanan kayıt olup olmadığını kontrol edip yeniden dene.");}
    finally {setSaving(false);}
  };
  const printReport = async () => {
    setPdfBusy(true); setPdfError("");
    try {
      const { buildReport } = await import("./report");
      if (invalidRange || !reportApplications.length) throw new Error("EMPTY_REPORT");
      const rows = [...reportApplications].sort((a, b) => {
        if (!a.appliedOn && !b.appliedOn) return 0;
        if (!a.appliedOn) return 1;
        if (!b.appliedOn) return -1;
        return b.appliedOn.localeCompare(a.appliedOn) || b.id - a.id;
      }).map(item => ({
        company: item.company, role: item.role, location: item.location || "",
        date: item.appliedOn ? new Intl.DateTimeFormat(locale).format(new Date(`${item.appliedOn}T12:00:00`)) : t.noDate,
        source: localizedSource(item.source, language) || t.noSource, status: statuses[item.status] || item.status,
        next: [item.nextActionDate ? new Intl.DateTimeFormat(locale).format(new Date(`${item.nextActionDate}T12:00:00`)) : "", localizedContent(item.nextAction, language) || t.noNextAction].filter(Boolean).join("\n"),
      }));
      const period=[dateFrom||"…",dateTo||"…"].join(" – ");
      const reportScope=[language==="de"?"Zeitraum: ":"Dönem: ",period,filterStatus?statuses[filterStatus]:t.all].join(" ");
      const doc = await buildReport(rows, language, formatDate(today, language, true), undefined, {customerNumber,signature,period:reportScope});
      const fileName = language === "de" ? `Ahmet-Tepe-Bewerbungsnachweis-${today}.pdf` : `Ahmet-Tepe-Basvuru-Takip-${today}.pdf`;
      const pdfBlob = doc.output("blob") as Blob;
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const overlay = document.createElement("div");
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", language === "de" ? "PDF-Vorschau" : "PDF önizleme");
      overlay.style.cssText = "position:fixed;inset:0;z-index:1000;display:flex;flex-direction:column;background:#18202b;";

      const toolbar = document.createElement("div");
      toolbar.style.cssText = "display:flex;align-items:center;gap:12px;padding:10px 16px;color:#fff;font:600 14px system-ui,sans-serif;";
      const title = document.createElement("strong");
      title.textContent = language === "de" ? "PDF-Vorschau" : "PDF önizleme";
      const name = document.createElement("span");
      name.textContent = fileName;
      name.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
      const saveButton = document.createElement("button");
      saveButton.type = "button";
      saveButton.textContent = language === "de" ? "PDF speichern" : "PDF'yi kaydet";
      saveButton.style.cssText = "margin-left:auto;border:0;border-radius:7px;background:#1b5db9;color:#fff;padding:8px 12px;cursor:pointer;font:600 13px system-ui,sans-serif;";
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.textContent = language === "de" ? "Schließen" : "Kapat";
      closeButton.style.cssText = "border:1px solid #91a4bb;border-radius:7px;background:#fff;color:#18202b;padding:7px 12px;cursor:pointer;font:600 13px system-ui,sans-serif;";
      const status = document.createElement("span");
      status.setAttribute("role", "status");
      status.style.cssText = "position:absolute;left:-9999px;";
      toolbar.append(title, name, saveButton, closeButton, status);

      const frame = document.createElement("iframe");
      frame.src = pdfUrl;
      frame.title = fileName;
      frame.style.cssText = "flex:1;width:100%;border:0;background:#fff;";

      const closeViewer = () => { URL.revokeObjectURL(pdfUrl); overlay.remove(); };
      closeButton.addEventListener("click", closeViewer);
      saveButton.addEventListener("click", async () => {
        saveButton.disabled = true;
        try {
          const picker = (window as Window & { showSaveFilePicker?: (options: unknown) => Promise<{ createWritable: () => Promise<{ write: (value: Blob) => Promise<void>; close: () => Promise<void> }> }> }).showSaveFilePicker;
          if (picker) {
            const handle = await picker({
              suggestedName: fileName,
              types: [{ description: "PDF", accept: { "application/pdf": [".pdf"] } }],
              excludeAcceptAllOption: false,
            });
            const writable = await handle.createWritable();
            await writable.write(pdfBlob);
            await writable.close();
          } else {
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = fileName;
            link.click();
          }
          status.textContent = language === "de" ? "PDF gespeichert." : "PDF kaydedildi.";
        } catch (error) {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            status.textContent = language === "de" ? "PDF konnte nicht gespeichert werden." : "PDF kaydedilemedi.";
          }
        } finally {
          saveButton.disabled = false;
        }
      });
      overlay.append(toolbar, frame);
      document.body.appendChild(overlay);
    } catch {
      setPdfError(language === "de" ? "PDF konnte nicht erstellt werden. Bitte erneut versuchen." : "PDF oluşturulamadı. Lütfen tekrar deneyin.");
    } finally { setPdfBusy(false); }
  };
  const openApplication = (id: number) => {
    const element = document.getElementById(`app-${id}`) as HTMLDetailsElement | null;
    if (!element) return;
    element.open = true;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <main className="file-manager" data-language={language}>
      <div className="screen-ui">
        <aside className="side-rail">
          <div className="rail-brand"><span className="brand-mark">AT</span><span><strong>Ahmet Tepe</strong><small>{language === "de" ? "Bewerbungsdatei" : "iş arama dosyası"}</small></span></div>
          <div className="rail-rule" />
          <nav aria-label={t.area}>
            <p className="rail-label">{t.area}</p>
            <a className="rail-link active" href="#basvurular"><span>01</span> {t.files} <b>{applications.length}</b></a>
            <a className="rail-link" href="#takip"><span>02</span> {t.followUp} <b className={followUps.length ? "alert-count" : ""}>{followUps.length}</b></a>
            <a className="rail-link" href="#gorevler"><span>03</span> {t.tasks} <b>{tasks.length - completedTasks}</b></a>
            <a className="rail-link" href="#gunluk"><span>04</span> {t.journal}</a>
          </nav>
          <div className="rail-footer"><span className="live-dot" /> <strong>{t.live}</strong><p>{t.lastCheck}<br />{formatDate(today, language, true)}</p></div>
        </aside>

        <section className="workspace">
          <header className="workspace-header">
            <div><p className="breadcrumb">AHMET TEPE <span>/</span> {t.searchArea}</p><h1>{t.title}<span>.</span></h1><p className="workspace-intro">{t.intro}</p></div>
            <div className="header-actions"><div className="language-switcher" aria-label={t.selectedLanguage}><span>{t.selectedLanguage}</span><button className={language === "tr" ? "selected" : ""} type="button" onClick={() => changeLanguage("tr")} aria-pressed={language === "tr"}><img src="/flags/tr.svg" width="24" height="16" alt="" /> Türkçe</button><button className={language === "de" ? "selected" : ""} type="button" onClick={() => changeLanguage("de")} aria-pressed={language === "de"}><img src="/flags/de.svg" width="24" height="16" alt="" /> Deutsch</button></div>{gmailConnected ? <div className="gmail-session"><span className="gmail-connect gmail-connected" role="status">● {language === "de" ? "Gmail verbunden" : "Gmail bağlı"}</span><a className="gmail-switch" href="/api/gmail/connect">{language === "de" ? "Konto wechseln" : "Hesap değiştir"}</a><form action="/api/gmail/disconnect" method="post"><button className="gmail-disconnect" type="submit">{language === "de" ? "Verbindung trennen" : "Bağlantıyı kes"}</button></form></div> : <a className="gmail-connect" href="/api/gmail/connect">{language === "de" ? "Gmail verbinden" : "Gmail'i bağla"}</a>}<button className="report-button" type="button" onClick={printReport} disabled={pdfBusy} aria-busy={pdfBusy}><span>↓</span><strong>{pdfBusy ? (language === "de" ? "Wird erstellt…" : "Hazırlanıyor…") : t.pdf}</strong><small>{t.pdfHint}</small></button><LiveRefresh language={language} /><details className="add-menu" onKeyDown={event => { if (event.key === "Escape") { event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); } }}><summary><span>＋</span> {t.newApplication}</summary><div className="form-popover">
              <div className="popover-head"><div><p className="eyebrow">{t.addToFile}</p><h3>{t.newOpportunity}</h3><p>{t.saveOpportunityHint}</p></div><button className="close-panel" type="button" aria-label={t.dismiss} onClick={event => { const panel = event.currentTarget.closest("details"); if (panel) panel.open = false; }}>×</button></div>
              <form action={saveApplication}>
                {saveError && <p role="alert">{saveError}</p>}
                <div className="form-row"><label>{language === "de" ? "Arbeitgeber" : "Şirket / kurum"}<input name="company" required placeholder={language === "de" ? "z. B. Landkreis Gifhorn" : "Örn. Landkreis Gifhorn"} /></label><label>{language === "de" ? "Position" : "Pozisyon"}<input name="role" required placeholder={language === "de" ? "z. B. Mathematiklehrer" : "Örn. Mathematiklehrer"} /></label></div>
                <div className="form-row"><label>{language === "de" ? "Bereich" : "Alan"}<select name="track"><option value="teaching">{trackLabels[language].teaching}</option><option value="cyber">{trackLabels[language].cyber}</option><option value="other">{trackLabels[language].other}</option></select></label><label>{language === "de" ? "Passung" : "Uygunluk"}<input name="score" type="number" min="0" max="100" defaultValue="80" /></label></div>
                <div className="form-row"><label>{t.source}<input name="source" placeholder={language === "de" ? "Arbeitsagentur, LinkedIn ..." : "Arbeitsagentur, LinkedIn…"} /></label><label>{language === "de" ? "Ort" : "Konum"}<input name="location" placeholder="Gifhorn" /></label></div>
                <div className="form-row"><label>{language === "de" ? "Bewerbung am" : "Başvuru tarihi"}<input name="appliedOn" type="date" /></label><label>{language === "de" ? "Nachfassen am" : "Takip tarihi"}<input name="nextActionDate" type="date" /></label></div>
                <label>{language === "de" ? "Stellenlink" : "İlan bağlantısı"}<input name="url" type="url" placeholder="https://…" /></label>
                <label>{t.nextStep}<input name="nextAction" placeholder={language === "de" ? "z. B. In 7 Tagen E-Mail prüfen" : "Örn. 7 gün sonra e-posta kontrolü"} /></label>
                <div className="form-row"><label>{t.contact}<input name="contactName" placeholder={language === "de" ? "Name" : "Ad soyad"} /></label><label>{language === "de" ? "E-Mail" : "E-posta"}<input name="contactEmail" type="email" placeholder="name@institution.de" /></label></div>
                <label>{language === "de" ? "Notiz / Bedingungen" : "Not / şartlar"}<textarea name="notes" placeholder={language === "de" ? "Anforderungen, Unterlagen, Erinnerungen ..." : "İlan şartları, belgeler, hatırlatmalar…"} /></label>
                <button type="submit" disabled={saving}>{language === "de" ? "Bewerbung speichern" : "Başvuruyu kaydet"} <span>↗</span></button>
              </form>
            </div></details></div>
          </header>

          {pdfError && <p role="alert" className="pdf-error">{pdfError}</p>}
          <div className="file-toolbar" id="takip"><div className="toolbar-title"><span className="folder-tab">A</span><strong>{language === "de" ? "Alle Bewerbungen" : "Tüm başvurular"}</strong><b>{applications.length}</b></div><div className="toolbar-stats"><span><strong>{active.length}</strong> {t.open}</span><span><strong>{awaiting.length}</strong> {t.awaiting}</span><span><strong>{inMotion.length}</strong> {t.advanced}</span><span className={followUps.length ? "is-alert" : ""}><strong>{followUps.length}</strong> {t.due}</span><span><strong>%{avgScore}</strong> {t.averageMatch}</span></div><span className="toolbar-date">{todayLabel}</span>{dismissed.size > 0 && <button className="restore-alerts" type="button" onClick={restoreAll}>{t.restoreDismissed}</button>}</div>

          <section className="record-controls" aria-label={language==="de"?"Suche und Bericht":"Arama ve rapor"}>
            <label>{language==="de"?"Arbeitgeber, Stelle oder Ort suchen":"Kurum, pozisyon veya şehir ara"}<input type="search" value={query} onChange={e=>setQuery(e.target.value)} /></label>
            <label>{t.status}<select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option value="">{t.all}</option>{statusOrder.map(s=><option key={s} value={s}>{statuses[s]}</option>)}</select></label>
            <label>{language==="de"?"Bereich":"Alan"}<select value={filterTrack} onChange={e=>setFilterTrack(e.target.value)}><option value="">{t.all}</option>{Object.entries(trackLabels[language]).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
            <label>{language==="de"?"Bewerbungsdatum ab":"Başvuru tarihi başlangıç"}<input type="date" value={dateFrom} max={dateTo||undefined} onChange={e=>setDateFrom(e.target.value)} /></label>
            <label>{language==="de"?"Bis":"Bitiş"}<input type="date" value={dateTo} min={dateFrom||undefined} onChange={e=>setDateTo(e.target.value)} /></label>
            <div className="control-actions"><button type="button" onClick={()=>{setQuery("");setFilterStatus("");setFilterTrack("");setDateFrom("");setDateTo("");}}>{language==="de"?"Filter zurücksetzen":"Filtreleri temizle"}</button><button type="button" onClick={exportBackup}>{language==="de"?"Datensicherung (JSON)":"Verileri yedekle (JSON)"}</button></div>
      <p role="status">{invalidRange?(language==="de"?"Datumsbereich ungültig.":"Tarih aralığı geçersiz."):`${filtered.length} / ${applications.length}`}</p>
            <details><summary>{language==="de"?"Papierkorb":"Çöp kutusu"} ({trash.length})</summary>{trash.map(item=><div className="trash-row" key={item.id}><span>{item.company} — {item.role}</span><form action={async data=>{await restoreApplication(data);router.refresh();}}><input type="hidden" name="id" value={item.id}/><button type="submit">{language==="de"?"Wiederherstellen":"Geri yükle"}</button></form></div>)}{!trash.length&&<p>{language==="de"?"Papierkorb ist leer.":"Çöp kutusu boş."}</p>}</details>
          </section>
          <section className="career-tools"><details><summary>{language==="de"?"Jobcenter-Berichtsprofil":"Jobcenter rapor profili"}</summary><p>{language==="de"?"Nur für diesen PDF-Download. Kundennummer wird weder gespeichert noch an den Server gesendet. Zeitraum und Status entsprechen den Filtern oben.":"Yalnızca bu PDF çıktısı için. Müşteri numarası kaydedilmez ve sunucuya gönderilmez. Dönem ve durum yukarıdaki filtrelerden alınır."}</p><label>{language==="de"?"Kundennummer (optional)":"Müşteri numarası (isteğe bağlı)"}<input maxLength={40} autoComplete="off" value={customerNumber} onChange={e=>setCustomerNumber(e.target.value)}/></label><label className="confirm-check"><input type="checkbox" checked={signature} onChange={e=>setSignature(e.target.checked)}/>{language==="de"?"Unterschriftsfeld im PDF":"PDF'ye imza alanı ekle"}</label></details></section>
          <CareerTools key={language} applications={applications} career={career} language={language} today={today}/>
          <details className="audit-tools"><summary>{language === "de" ? "Berichtsdaten prüfen" : "Rapor verilerini kontrol et"}</summary><p>{language === "de" ? "Hier können die Angaben der einzelnen Bewerbungen für einen klaren Jobcenter-Bericht korrigiert werden." : "Buradan her başvurunun Jobcenter raporu için kurum, durum, tarih, takip ve geri dönüş bilgilerini düzeltebilirsin."}</p><div className="audit-editor-list">{applications.map(item => <ApplicationAuditEditor key={item.id} item={item} language={language} />)}</div></details>
          <div className="file-layout">
            <section className="file-list" id="basvurular" aria-label={language === "de" ? "Bewerbungsverfolgung" : "Başvuru takibi"}>
              <div className="list-intro"><div><p className="eyebrow"><span className="eyebrow-line" /> {t.records}</p><h2>{t.applications}</h2></div><span className="list-note">{t.clickToOpen} · {language === "de" ? "Vom neuesten zum ältesten Eintrag sortiert" : "En yeni başvurudan en eskiye sıralı"}</span></div>
              {followUps.length > 0 && <section className="follow-up-alerts" aria-live="polite" aria-labelledby="follow-up-alert-heading"><div className="follow-up-alert-head"><div><p className="eyebrow"><span className="eyebrow-line" /> {t.followUpAlerts}</p><h3 id="follow-up-alert-heading">{t.followUpHint}</h3></div><button className="alert-dismiss-all" type="button" onClick={() => dismissAll(followUps.map(followUpKey))}>{t.dismissAll}</button></div><div className="follow-up-alert-list">{followUps.map((item) => <article className="follow-up-alert" key={followUpKey(item)}><div className="follow-up-alert-copy"><strong>{item.company}</strong><span>{localizedContent(item.nextAction, language) || t.noNextAction}</span><small>{item.nextActionDate ? formatDate(item.nextActionDate, language, true) : t.noDate}</small></div><div className="follow-up-alert-actions"><button className="alert-open" type="button" onClick={() => openApplication(item.id)}>{t.viewFile}</button><button className="alert-dismiss" type="button" onClick={() => dismiss(followUpKey(item))}>{t.dismiss}</button></div></article>)}</div></section>}
              <div className="list-head"><span>{t.number}</span><span></span><span>{t.jobCompany}</span><span>{t.source}</span><span>{t.status}</span><span>{t.followUpColumn}</span><span></span></div>
              {filtered.map((item, index) => {
                const due = Boolean(item.nextActionDate && item.nextActionDate <= today && openStatuses.has(item.status) && !dismissed.has(followUpKey(item)));
                const doneSteps = item.steps.filter((step) => step.done).length;
                return <details className={`file-entry ${due ? "is-due" : ""}`} id={`app-${item.id}`} key={item.id}>
                  <summary className="file-summary"><span className="file-index">{String(index + 1).padStart(2, "0")}</span><span className={`file-avatar avatar-${item.track}`}>{initials(item.company)}</span><span className="file-main"><strong>{item.role}</strong><small>{item.company} · {item.location || t.noLocation}</small><span className="file-tags"><b className={`track-tag ${item.track}`}>{trackLabels[language][item.track] || trackLabels[language].other}</b><b className={`score-tag ${item.score >= 85 ? "high" : item.score >= 70 ? "mid" : "low"}`}>%{item.score} {language === "de" ? "Passung" : "uyum"}</b></span></span><span className="file-source"><strong>{item.source || t.noSource}</strong><small>{item.appliedOn ? formatDate(item.appliedOn, language) : t.noDate}</small></span><span className={`status-pill ${item.status}`}><i />{statuses[item.status] || item.status}</span><span className={`file-follow ${due ? "due" : ""}`}><strong>{item.nextActionDate ? `${relativeDate(item.nextActionDate, today, language)} · ${formatDate(item.nextActionDate, language)}` : t.noPlan}</strong><small>{localizedContent(item.nextAction, language) || t.noNextAction}</small></span><span className="file-chevron">⌄</span></summary>
                  <div className="file-detail"><button className="close-detail" type="button" onClick={event => { const panel = event.currentTarget.closest("details"); if (panel) { panel.open = false; panel.querySelector("summary")?.focus(); } }}>{t.dismiss} ×</button><div className="detail-grid"><div className="detail-column"><p className="eyebrow">{t.updateStatus}</p><form action={updateApplicationStatus} className="status-editor"><input type="hidden" name="id" value={item.id} /><select aria-label={`${item.company} ${t.status}`} name="status" defaultValue={item.status}>{statusOrder.map((status) => <option key={status} value={status}>{statuses[status]}</option>)}</select><button type="submit">{t.save}</button></form>{item.url && <a className="job-link" href={item.url} target="_blank" rel="noreferrer">{t.openListing} <span>↗</span></a>}</div><div className="detail-column"><p className="eyebrow">{t.contact}</p><strong>{item.contactName || t.noContact}</strong><small>{item.contactEmail || item.contactPhone || t.noContactInfo}</small>{item.lastContactOn && <small>{t.lastContact}: {formatDate(item.lastContactOn, language)}</small>}</div><div className="detail-column"><p className="eyebrow">{t.feedback}</p><strong>{localizedContent(item.feedback, language) || t.noFeedback}</strong><small>{localizedContent(item.notes, language) || t.noNote}</small></div></div><DateEditor id={item.id} date={item.appliedOn} language={language}/><div className="detail-lower"><div className="checklist"><div className="mini-heading"><div><p className="eyebrow">{t.steps}</p><strong>{doneSteps}/{item.steps.length} {t.completed}</strong></div><span>{item.steps.length ? Math.round(doneSteps / item.steps.length * 100) : 0}%</span></div><div className="step-progress"><i style={{ width: `${item.steps.length ? doneSteps / item.steps.length * 100 : 0}%` }} /></div>{item.steps.map((step) => <form action={updateApplicationStep} key={step.id} className={step.done ? "step done" : "step"}><input type="hidden" name="stepId" value={step.id} /><input type="hidden" name="done" value={step.done ? "0" : "1"} /><button type="submit" aria-label={step.done ? (language === "de" ? "Schritt wieder öffnen" : "Adımı geri aç") : (language === "de" ? "Schritt erledigen" : "Adımı tamamla")}>{step.done ? "✓" : "○"}</button><span>{localizedStep(step.label, language)}</span></form>)}</div><div className="timeline"><div className="mini-heading"><div><p className="eyebrow">{t.timeline}</p><strong>{t.recent}</strong></div><span>{item.updates.length}</span></div>{item.updates.length ? <div className="timeline-list">{item.updates.map((update) => <div className="timeline-item" key={update.id}><i className={`timeline-dot ${update.updateType.toLowerCase().replace("-", "")}`} /><div><strong>{localizedContent(update.title, language)}</strong><small>{formatDate(update.happenedOn, language)}{update.body ? ` · ${localizedContent(update.body, language)}` : ""}</small></div></div>)}</div> : <p className="muted-text">{t.noUpdates}</p>}<form action={addApplicationUpdate} className="update-form"><input type="hidden" name="applicationId" value={item.id} /><div className="form-row"><select name="updateType" aria-label={t.updateStatus}>{updateTypeOptions[language].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><input name="happenedOn" type="date" defaultValue={today} /></div><input name="title" required placeholder={t.updateTitle} /><input name="body" placeholder={t.updateBody} /><button type="submit">＋ {t.addUpdate}</button></form></div></div><div className="detail-footer"><span>{t.source}: {item.source || t.noSource}</span><form action={async data=>{await deleteApplication(data);router.refresh();}}><input type="hidden" name="id" value={item.id} /><button className="delete" type="submit">{t.delete}</button></form></div></div>
                </details>;
              })}
              {!filtered.length && <div className="empty"><strong>{t.noFile}</strong><span>{t.noFileHint}</span></div>}
            </section>

            <aside className="inspector-column">
              {priority ? <section className="inspector-panel"><div className="inspector-heading"><p className="eyebrow"><span className="eyebrow-line" /> {t.priority}</p><span className={`status-pill ${priority.status}`}><i />{statuses[priority.status]}</span></div><h2>{priority.role}</h2><p className="inspector-company">{priority.company} · {priority.location || t.noLocation}</p>{priority.url && <a className="job-link" href={priority.url} target="_blank" rel="noreferrer">{t.openListing} <span>↗</span></a>}<div className="inspector-rule" /><dl className="meta-list"><div><dt>{t.tracking}</dt><dd className={followUps.includes(priority) ? "is-alert" : ""}>{priority.nextActionDate ? `${formatDate(priority.nextActionDate, language, true)} · ${relativeDate(priority.nextActionDate, today, language)}` : t.noPlan}</dd></div><div><dt>{t.source}</dt><dd>{priority.source || t.noSource}</dd></div><div><dt>{t.contact}</dt><dd>{priority.contactName || t.noContact}</dd></div><div><dt>{language === "de" ? "Passung" : "Uyum"}</dt><dd>%{priority.score}</dd></div></dl><div className="inspector-note"><span>{t.lastNote}</span><p>{localizedContent(priority.feedback, language) || localizedContent(priority.notes, language) || t.noNote}</p></div><form action={updateApplicationStatus} className="inspector-status"><input type="hidden" name="id" value={priority.id} /><select aria-label={t.updateStatus} name="status" defaultValue={priority.status}>{statusOrder.map((status) => <option key={status} value={status}>{statuses[status]}</option>)}</select><button type="submit">{t.save}</button></form><a className="inspector-open" href={`#app-${priority.id}`} onClick={() => openApplication(priority.id)}>{t.goToDetails} <span>↗</span></a></section> : <section className="inspector-panel empty-inspector"><p className="eyebrow">{t.priority}</p><h2>{t.noFile}</h2><p>{t.noFileHint}</p></section>}
              <section className="side-section" id="gunluk"><div className="side-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> {t.journal}</p><h2>{t.recent}</h2></div><span>{recentUpdates.length}</span></div>{recentUpdates.length ? <div className="activity-list">{recentUpdates.map((update) => <a className="activity-item" onClick={() => openApplication(update.applicationId)} href={`#app-${update.applicationId}`} key={`${update.applicationId}-${update.id}`}><span className={`activity-icon ${update.updateType.toLowerCase().replace("-", "")}`}>{update.updateType === "E-posta" || update.updateType === "E-Mail" ? "@" : update.updateType === "Durum" || update.updateType === "Status" ? "↗" : "•"}</span><span><strong>{localizedContent(update.title, language)}</strong><small>{update.applicationName} · {formatDate(update.happenedOn, language)}</small></span></a>)}</div> : <p className="muted-text">{t.noUpdates}</p>}</section>
              <section className="side-section tasks-section" id="gorevler"><div className="side-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> {t.today}</p><h2>{t.todo}</h2></div><span>{completedTasks}/{tasks.length}</span></div><div className="task-list">{tasks.map((task, index) => <form action={updateTask} key={task.id} className={task.done ? "task done" : "task"}><input type="hidden" name="id" value={task.id} /><input type="hidden" name="done" value={task.done ? "0" : "1"} /><button type="submit" aria-label={task.done ? (language === "de" ? "Aufgabe wieder öffnen" : "Görevi geri aç") : (language === "de" ? "Aufgabe erledigen" : "Görevi tamamla")}>{task.done ? "✓" : String(index + 1).padStart(2, "0")}</button><span><strong>{localizedTask(task.title, language)}</strong><small>{localizedCategory(task.category, language)} · {language === "de" ? task.estimate.replace(/dk/g, "Min.") : task.estimate}</small></span></form>)}</div><details className="quick-task"><summary>＋ {t.addTask}</summary><form action={addTask}><input name="title" required placeholder={language === "de" ? "Neue Aufgabe" : "Yeni görev"} /><div className="form-row"><input name="category" placeholder={language === "de" ? "Kategorie" : "Kategori"} /><input name="estimate" placeholder={language === "de" ? "30 Min." : "30 dk"} /></div><button type="submit">{t.add}</button></form></details></section>
            </aside>
          </div>
        </section>
      </div>

      <section className="print-report" aria-hidden="true"><header className="print-header"><div><p className="print-kicker">{t.pdfTitle}</p><h1>{t.pdfSubtitle}</h1></div><div className="print-meta"><span>{t.generated}</span><strong>{formatDate(today, language, true)}</strong><small>{language === "de" ? "Sprache: Deutsch" : "Dil: Türkçe"}</small></div></header><div className="print-summary"><span><strong>{reportApplications.length}</strong> {t.applications.toLowerCase()}</span><span><strong>{reportApplications.filter(item => openStatuses.has(item.status)).length}</strong> {t.open}</span><span><strong>{reportApplications.filter(item => item.status === "waiting").length}</strong> {t.awaiting}</span><span><strong>%{reportApplications.length ? Math.round(reportApplications.reduce((sum, item) => sum + item.score, 0) / reportApplications.length) : 0}</strong> {t.averageMatch}</span></div><table className="print-table"><thead><tr><th>{t.number}</th><th>{t.employer}</th><th>{t.reportSource}</th><th>{t.reportStatus}</th><th>{t.applicationDate}</th><th>{t.reportNext}</th></tr></thead><tbody>{reportApplications.map((item, index) => <tr key={item.id}><td>{String(index + 1).padStart(2, "0")}</td><td><strong>{item.company}</strong><br /><span>{item.role}</span><br /><small>{item.location || t.noLocation}</small></td><td>{item.source || t.noSource}</td><td><span className={`print-status ${item.status}`}>{statuses[item.status] || item.status}</span></td><td>{item.appliedOn ? formatDate(item.appliedOn, language, true) : t.noDate}</td><td>{item.nextActionDate ? `${formatDate(item.nextActionDate, language, true)} - ${localizedContent(item.nextAction, language) || t.noNextAction}` : t.noPlan}</td></tr>)}</tbody></table><section className="print-details"><h2>{language === "de" ? "Hinweise zu den Bewerbungen" : "Başvurular için notlar"}</h2>{reportApplications.map((item) => <article key={item.id}><h3>{item.company} - {item.role}</h3><p><strong>{t.reportContact}:</strong> {item.contactName || t.noContact}{item.contactEmail ? ` · ${item.contactEmail}` : ""}</p><p><strong>{t.notes}:</strong> {localizedContent(item.feedback, language) || localizedContent(item.notes, language) || t.noNote}</p></article>)}</section><footer className="print-footer">{t.reportFooter}</footer></section>
    </main>
  );
}
