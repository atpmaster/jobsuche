export type InterviewUpdateLike = { title?: string | null; body?: string | null };
export type InterviewDetails = { date: string; time: string };

const invitationWords = /(vorstellungsgespräch|persönlichen gespräch|persönliches gespräch|zum gespräch|laden wir sie .* ein|termin bestätigen|mülakat|görüşme daveti|görüşmeye davet|görüşmeye çağır)/i;
const confirmationWords = /\b(?:bestätig\w*|confirm\w*|teyit\w*|onayl\w*)\b[\s\S]{0,140}\b(?:termin|vorstellungsgespräch|gespräch|appointment|interview|görüşme)\b|\b(?:termin|vorstellungsgespräch|gespräch|appointment|interview|görüşme)\b[\s\S]{0,100}\b(?:bestätig\w*|confirm\w*|teyit\w*|onayl\w*)\b/i;
const rejectionWords = [
  /\babsage\b/i,
  /\b(?:nicht|keine)\b.{0,140}\b(?:engere[nr]? auswahl|auswahl|berücksichtig\w*|beruecksichtig\w*|positive nachricht|nehmen)\b/i,
  /\b(?:engere[nr]? auswahl|auswahl)\b.{0,140}\b(?:nicht|keine)\b.{0,100}\b(?:berücksichtig\w*|beruecksichtig\w*)\b/i,
  /\bnicht\s+(?:weiter\s+)?berücksichtig\w*\b/i,
  /\bnicht\s+(?:weiter\s+)?beruecksichtig\w*\b/i,
  /\bleider\b.{0,100}\bmitteilen\b/i,
  /\bstelle bereits besetzt\b/i,
  /\b(?:bewerbung|bewerber)\b.{0,60}\b(?:abgelehnt|nicht berücksichtigt|nicht beruecksichtigt)\b/i,
  /\b(?:olumsuz|reddedildi|kabul edilmedi|başka bir aday)\b/i,
];
const jobContextWords = /\b(?:bewerb\w*|unterlagen|stelle|stellenangebot|position|anstellung|auswahl\w*|karriere|recruiting|personal|job|tätigkeit|beschaeftigung|beschäftigung|application)\b/i;
const unrelatedMessageWords = /\b(?:einbürgerung|staatsangehörigkeit|mitgliedschaft|widerruf|versicherung|kita|krippenplatz|vertrag)\b/i;

function normalizeDate(day: string, month: string, year: string) {
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

const monthNames: Record<string, string> = {
  januar: "01", februar: "02", märz: "03", maerz: "03", april: "04", mai: "05", juni: "06", juli: "07", august: "08", september: "09", oktober: "10", november: "11", dezember: "12",
  ocak: "01", şubat: "02", subat: "02", mart: "03", nisan: "04", mayıs: "05", mayis: "05", haziran: "06", temmuz: "07", ağustos: "08", agustos: "08", eylül: "09", eylul: "09", ekim: "10", kasım: "11", kasim: "11", aralık: "12", aralik: "12",
};

function scheduledDetails(value: string) {
  const date = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const time = value.match(/T(\d{2}):(\d{2})/);
  return date && time ? { date: `${date[1]}-${date[2]}-${date[3]}`, time: `${time[1]}:${time[2]}` } : null;
}

export function extractInterviewDetails(text: string) {
  if (!invitationWords.test(text) && !confirmationWords.test(text)) return null;
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  const german = text.match(/\b(\d{1,2})[.]([0]?[1-9]|1[0-2])[.](\d{4})\b/);
  const slash = text.match(/\b(\d{1,2})[/]([0]?[1-9]|1[0-2])[/](\d{4})\b/);
  const named = text.match(/\b(\d{1,2})[.]?\s+(Januar|Februar|März|Maerz|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember|Ocak|Şubat|Subat|Mart|Nisan|Mayıs|Mayis|Haziran|Temmuz|Ağustos|Agustos|Eylül|Eylul|Ekim|Kasım|Kasim|Aralık|Aralik)\s+(\d{4})\b/i);
  const namedMonth = named ? monthNames[named[2].toLocaleLowerCase("tr-TR")] || monthNames[named[2].toLowerCase()] : null;
  const date = iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : german ? normalizeDate(german[1], german[2], german[3]) : slash ? normalizeDate(slash[1], slash[2], slash[3]) : named && namedMonth ? normalizeDate(named[1], namedMonth, named[3]) : null;
  const colonTime = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\s*(?:Uhr)?\b/i);
  const dotTime = text.match(/\b([01]?\d|2[0-3])[.]([0-5]\d)(?![.]\d{4})\s*(?:Uhr)?\b/i);
  const hourTime = text.match(/\b([01]?\d|2[0-3])\s+Uhr\b/i);
  const timeMatch = colonTime || dotTime || hourTime;
  const time = timeMatch ? `${timeMatch[1].padStart(2, "0")}:${(timeMatch[2] || "00").padStart(2, "0")}` : null;
  return date && time ? { date, time } : null;
}

export function getInterviewDetails(updates: InterviewUpdateLike[], startsAt?: string | null) {
  if (startsAt) {
    const scheduled = scheduledDetails(startsAt);
    if (scheduled) return scheduled;
  }
  for (const update of updates) {
    const details = extractInterviewDetails(`${update.title || ""} ${update.body || ""}`);
    if (details) return details;
  }
  return null;
}

export function isConfirmedInterview(updates: InterviewUpdateLike[], startsAt?: string | null) {
  return Boolean(getInterviewDetails(updates, startsAt));
}

export function isInterviewConfirmation(updates: InterviewUpdateLike[]) {
  return updates.some((update) => confirmationWords.test(`${update.title || ""} ${update.body || ""}`))
    && Boolean(getInterviewDetails(updates));
}

export function isRejectionResponse(value: string) {
  return rejectionWords.some((pattern) => pattern.test(value));
}

export function isJobRejectionResponse(value: string) {
  const text = value || "";
  if (!isRejectionResponse(text) || !jobContextWords.test(text)) return false;
  return !(unrelatedMessageWords.test(text) && !/\b(?:bewerb\w*|unterlagen|stelle|position|anstellung|auswahl\w*)\b/i.test(text));
}

export function formatInterviewDetails(details: InterviewDetails | null, language: "tr" | "de") {
  if (!details) return null;
  const date = new Intl.DateTimeFormat(language === "de" ? "de-DE" : "tr-TR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${details.date}T12:00:00`));
  return `${language === "de" ? "Termin" : "Mülakat"}: ${date}, ${details.time}`;
}
