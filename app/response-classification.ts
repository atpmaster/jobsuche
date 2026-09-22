import { isConfirmedInterview, isJobRejectionResponse } from "./interview-utils";

export const responseClassificationValues = [
  "none",
  "acknowledgement",
  "under_review",
  "interview",
  "rejected",
  "positive",
  "documents",
  "other",
] as const;

export type ResponseClassification = (typeof responseClassificationValues)[number];

export function isResponseClassification(value: string | null | undefined): value is ResponseClassification {
  return Boolean(value && responseClassificationValues.includes(value as ResponseClassification));
}

/**
 * Classifies the content of a received message independently from the
 * workflow status. The workflow can therefore say "received" while this
 * field says why the message matters (interview, rejection, etc.).
 */
export function classifyResponse(text: string, title = ""): ResponseClassification {
  const value = `${title} ${text}`.replace(/\s+/g, " ").trim();
  if (!value) return "none";
  if (isJobRejectionResponse(value)) return "rejected";
  if (isConfirmedInterview([{ title: value, body: "" }])) return "interview";
  if (/\b(?:willkommen|wir freuen uns|gerne laden wir|nächster schritt|naechster schritt|next step|positive rückmeldung|positive rueckmeldung|tebrik|memnuniyetle)\b/i.test(value)) return "positive";
  if (/\b(?:fehlende unterlagen|unterlagen nachreichen|zusätzliche unterlagen|zusatzliche unterlagen|weitere unterlagen|bitte.*(?:unterlagen|nachweise|bescheinigung)|ek belge|eksik belge|belge.*gönder|bilgi.*gönder)\b/i.test(value)) return "documents";
  if (/\b(?:eingangsbestätigung|eingang.*bestätigt|eingang.*bestaetigt|bewerbung.*eingegangen|danke für ihre bewerbung|danke fuer ihre bewerbung|başvuru alındı|başvurunuz alındı|başvuru.*teyit|application received|receipt)\b/i.test(value)) return "acknowledgement";
  if (/\b(?:wird geprüft|wird geprueft|in prüfung|in pruefung|sorgfältig geprüft|sorgfaeltig geprueft|unterlagen.*prüfen|unterlagen.*pruefen|inceleniyor|değerlendiriliyor|degerlendiriliyor)\b/i.test(value)) return "under_review";
  return "other";
}

