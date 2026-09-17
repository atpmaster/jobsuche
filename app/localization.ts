export type Language = "tr" | "de";

export const statusLabels: Record<Language, Record<string, string>> = {
  tr: {
    new: "Yeni başvuru",
    listed: "Listeye eklendi",
    sent: "Gönderildi",
    waiting: "Cevap bekleniyor",
    received: "Cevap geldi",
    withdrawn: "Kayıt dışı",
    saved: "Yeni başvuru",
    preparing: "Listeye eklendi",
    applied: "Cevap bekleniyor",
    interview: "Mülakat daveti geldi",
    offer: "Cevap geldi",
    rejected: "Ret / olumsuz cevap",
  },
  de: {
    new: "Neue Bewerbung",
    listed: "Zur Liste hinzugefügt",
    sent: "Gesendet",
    waiting: "Rückmeldung ausstehend",
    received: "Rückmeldung erhalten",
    withdrawn: "Kein Bewerbungsvorgang",
    saved: "Neue Bewerbung",
    preparing: "Zur Liste hinzugefügt",
    applied: "Rückmeldung ausstehend",
    interview: "Vorstellungsgespräch-Einladung erhalten",
    offer: "Rückmeldung erhalten",
    rejected: "Absage / negative Rückmeldung",
  },
};

type Translation = Record<Language, string>;

const sourceTranslations: Record<string, Translation> = {
  "Arbeitsagentur / myschoolcare": { tr: "İş Ajansı / myschoolcare", de: "Arbeitsagentur / myschoolcare" },
  "Landkreis Gifhorn / Bewerbermanagement": { tr: "Gifhorn ilçesi / başvuru yönetimi", de: "Landkreis Gifhorn / Bewerbermanagement" },
  "IT-Verbund Gifhorn / Karriereportal": { tr: "IT-Verbund Gifhorn / kariyer portalı", de: "IT-Verbund Gifhorn / Karriereportal" },
  "Paritätischer Niedersachsen / E-Mail": { tr: "Paritätischer Niedersachsen / E-posta", de: "Paritätischer Niedersachsen / E-Mail" },
  "EIS-Online-BBS / E-Mail": { tr: "EIS-Online-BBS / E-posta", de: "EIS-Online-BBS / E-Mail" },
  "Gmail / Gesendete E-Mails": { tr: "Gmail / Gönderilen e-postalar", de: "Gmail / Gesendete E-Mails" },
  "Gmail / Gönderilen e-postalar": { tr: "Gmail / Gönderilen e-postalar", de: "Gmail / Gesendete E-Mails" },
  "başvuru yönetimi.net": { tr: "başvuru yönetimi.net", de: "Bewerbermanagement.net" },
  "E-Mail": { tr: "E-posta", de: "E-Mail" },
  "E-posta": { tr: "E-posta", de: "E-Mail" },
  "Başvuru yönetimi": { tr: "Başvuru yönetimi", de: "Bewerbermanagement" },
  "Bewerbermanagement": { tr: "Başvuru yönetimi", de: "Bewerbermanagement" },
  "Karriereportal": { tr: "Kariyer portalı", de: "Karriereportal" },
  "ESE-Karriereportal": { tr: "ESE kariyer portalı", de: "ESE-Karriereportal" },
  "ESE kariyer portalı": { tr: "ESE kariyer portalı", de: "ESE-Karriereportal" },
};

const contentTranslations: Record<string, Translation> = {
  "20–40 saat; başvuru portalında tamamlandı.": { tr: "20–40 saat; başvuru portalında tamamlandı.", de: "20–40 Stunden; im Bewerbungsportal abgeschlossen." },
  "20–40 Stunden; im Bewerbungsportal abgeschlossen.": { tr: "20–40 saat; başvuru portalında tamamlandı.", de: "20–40 Stunden; im Bewerbungsportal abgeschlossen." },
  "Vollzeit, ab sofort; portalda başarıyla gönderildi.": { tr: "Tam zamanlı, hemen başlayabilecek; portal üzerinden başarıyla gönderildi.", de: "Vollzeit, ab sofort; erfolgreich über das Portal gesendet." },
  "Tam zamanlı, hemen başlayabilecek; portal üzerinden başarıyla gönderildi.": { tr: "Tam zamanlı, hemen başlayabilecek; portal üzerinden başarıyla gönderildi.", de: "Vollzeit, ab sofort; erfolgreich über das Portal gesendet." },
  "Başvuru alındı teyidi geldi; Personalteam incelemesinden sonra dönüş yapılacak.": { tr: "Başvuru alındı teyidi geldi; personel ekibinin incelemesinden sonra dönüş yapılacak.", de: "Eingangsbestätigung erhalten; Rückmeldung nach Prüfung durch das Personalteam." },
  "Otomatik alındı teyidi: belgeler dikkatle inceleniyor.": { tr: "Otomatik alındı teyidi: belgeler dikkatle inceleniyor.", de: "Automatische Eingangsbestätigung: Die Unterlagen werden sorgfältig geprüft." },
  "Bewerbung und 18-seitige Unterlagen per E-Mail versendet; Rückmeldung ausstehend.": { tr: "Başvuru ve 18 sayfalık belgeler e-posta ile gönderildi; geri dönüş bekleniyor.", de: "Bewerbung und 18-seitige Unterlagen per E-Mail versendet; Rückmeldung ausstehend." },
  "Stellennummer 18049-26 · unterschriebener Bewerbungsbogen und aktualisierte Unterlagen nachgereicht.": { tr: "İlan numarası 18049-26 · imzalı başvuru formu ve güncellenmiş belgeler sonradan gönderildi.", de: "Stellennummer 18049-26 · unterschriebener Bewerbungsbogen und aktualisierte Unterlagen nachgereicht." },
  "Unterschriebener EIS-Bewerbungsbogen und aktualisierte 18-seitige PDF-Unterlagen an die BBS I Gifhorn gesendet.": { tr: "İmzalı EIS başvuru formu ve güncellenmiş 18 sayfalık PDF belgeleri BBS I Gifhorn'a gönderildi.", de: "Unterschriebener EIS-Bewerbungsbogen und aktualisierte 18-seitige PDF-Unterlagen an die BBS I Gifhorn gesendet." },
  "Bewerbungsbogen und Unterlagen versendet": { tr: "Başvuru formu ve belgeler gönderildi", de: "Bewerbungsbogen und Unterlagen versendet" },
  "Bewerbung aus Gmail importiert": { tr: "Başvuru Gmail'den aktarıldı", de: "Bewerbung aus Gmail importiert" },
  "Başvuru alındı teyidi anfordern": { tr: "Başvuru alındı teyidini iste", de: "Eingangsbestätigung anfordern" },
  "Başvuru alındı teyidini kontrol et": { tr: "Başvuru alındı teyidini kontrol et", de: "Eingangsbestätigung prüfen" },
  "Nicht weiterverfolgen": { tr: "Başka işlem gerekmiyor", de: "Nicht weiterverfolgen" },
  "Başka işlem gerekmiyor": { tr: "Başka işlem gerekmiyor", de: "Keine weitere Aktion" },
  "geri dönüş takip et": { tr: "Geri dönüşü takip et", de: "Rückmeldung nachfassen" },
  "Geri dönüşü takip et": { tr: "Geri dönüşü takip et", de: "Rückmeldung nachfassen" },
  "Fehlende Bewerbungsunterlagen nachreichen": { tr: "Eksik başvuru belgelerini sonradan gönder", de: "Fehlende Bewerbungsunterlagen nachreichen" },
  "geri dönüş nachfassen": { tr: "Geri dönüşü takip et", de: "Rückmeldung nachfassen" },
  "Keine weitere Aktion – Stelle bereits besetzt": { tr: "Başka işlem gerekmiyor – pozisyon doldu", de: "Keine weitere Aktion – Stelle bereits besetzt" },
  "Keine weitere Aktion – Absage erhalten": { tr: "Başka işlem gerekmiyor – ret yanıtı alındı", de: "Keine weitere Aktion – Absage erhalten" },
  "Bewerbung für Stellennummer 18049-26 gesendet. EIS-Bewerbungsbogen sowie die aktualisierten Unterlagen wurden am 11.09.2026 nachgereicht; geri dönüş steht aus.": { tr: "18049-26 ilan numarası için başvuru gönderildi. EIS başvuru formu ve güncellenmiş belgeler 11.09.2026 tarihinde sonradan gönderildi; geri dönüş bekleniyor.", de: "Bewerbung für Stellennummer 18049-26 gesendet. EIS-Bewerbungsbogen sowie die aktualisierten Unterlagen wurden am 11.09.2026 nachgereicht; Rückmeldung steht aus." },
  "Gmail yanıtı:": { tr: "Gmail cevabı:", de: "Gmail-Antwort:" },
  "Geri dönüşü kontrol et": { tr: "Geri dönüşü kontrol et", de: "Rückmeldung prüfen" },
  "Geri dönüşü bekle": { tr: "Geri dönüşü bekle", de: "Rückmeldung abwarten" },
  "Mülakat tarihini ve bağlantısını doğrula; görüşmeye hazırlan": { tr: "Mülakat tarihini ve bağlantısını doğrula; görüşmeye hazırlan", de: "Termin und Gesprächslink bestätigen; auf das Gespräch vorbereiten" },
  "Termin und Gesprächslink bestätigen; auf das Gespräch vorbereiten": { tr: "Mülakat tarihini ve bağlantısını doğrula; görüşmeye hazırlan", de: "Termin und Gesprächslink bestätigen; auf das Gespräch vorbereiten" },
  "Başvuru teyidini ve açık pozisyonları izle": { tr: "Başvuru teyidini ve açık pozisyonları izle", de: "Eingangsbestätigung und offene Stellen beobachten" },
  "Yanıt için takip tarihi geldiğinde kontrol et": { tr: "Yanıt için takip tarihi geldiğinde kontrol et", de: "Zum Nachfassdatum auf Rückmeldung prüfen" },
  "Eingangsbestätigung prüfen": { tr: "Başvuru alındı teyidini kontrol et", de: "Eingangsbestätigung prüfen" },
  "Eingangsbestätigung kontrollieren": { tr: "Başvuru alındı teyidini kontrol et", de: "Eingangsbestätigung kontrollieren" },
  "Eingangsbestätigung abwarten": { tr: "Başvuru alındı teyidini bekle", de: "Eingangsbestätigung abwarten" },
  "Rückmeldung abwarten": { tr: "Geri dönüşü bekle", de: "Rückmeldung abwarten" },
  "Rückmeldung prüfen": { tr: "Geri dönüşü kontrol et", de: "Rückmeldung prüfen" },
  "Rückmeldung kontrollieren": { tr: "Geri dönüşü kontrol et", de: "Rückmeldung kontrollieren" },
  "Rückmeldung anfordern": { tr: "Geri dönüş iste", de: "Rückmeldung anfordern" },
  "Rückmeldung bei Sylvia Hauk anfordern": { tr: "Sylvia Hauk'tan geri dönüş iste", de: "Rückmeldung bei Sylvia Hauk anfordern" },
  "Überfällige Rückmeldung nachfassen": { tr: "Geciken geri dönüşü takip et", de: "Überfällige Rückmeldung nachfassen" },
  "Antwort prüfen und Eignung für Förderschule klären": { tr: "Yanıtı kontrol et ve destek okuluna uygunluğu değerlendir", de: "Antwort prüfen und Eignung für Förderschule klären" },
  "Letzten Status im Portal prüfen": { tr: "Portaldaki son durumu kontrol et", de: "Letzten Status im Portal prüfen" },
  "Eingangsbestätigung und Rückmeldung kontrollieren": { tr: "Başvuru alındı teyidini ve geri dönüşü kontrol et", de: "Eingangsbestätigung und Rückmeldung kontrollieren" },
  "Aktuelle Stellenangebote prüfen und passende Stelle direkt bewerben": { tr: "Güncel ilanları kontrol et ve uygun ilana doğrudan başvur", de: "Aktuelle Stellenangebote prüfen und sich direkt auf eine passende Stelle bewerben" },
  "Rückmeldung nach der Auswahlprüfung abwarten": { tr: "Seçim incelemesinden sonra geri dönüşü bekle", de: "Rückmeldung nach der Auswahlprüfung abwarten" },
  "Keine weitere Aktion – direkter Bewerbungsweg nicht möglich": { tr: "Başka işlem gerekmiyor – doğrudan başvuru yolu mümkün değil", de: "Keine weitere Aktion – direkter Bewerbungsweg nicht möglich" },
  "04.09.2026: Schule informiert, dass es sich um eine Förderschule handelt": { tr: "04.09.2026: Okul, buranın bir destek okulu olduğunu bildirdi.", de: "04.09.2026: Schule informiert, dass es sich um eine Förderschule handelt" },
  "17.09.2026 tarihinde ESE kariyer portalı üzerinden başvuru gönderildi. Siber güvenlik CV’si ve birleştirilmiş başvuru PDF’si eklendi. Başlangıç tarihi 21.09.2026; 24.09.2026 tarihinde başvuru teyidi kontrol edilecek.": {
    tr: "17.09.2026 tarihinde ESE kariyer portalı üzerinden başvuru gönderildi. Siber güvenlik CV’si ve birleştirilmiş başvuru PDF’si eklendi. Başlangıç tarihi 21.09.2026; 24.09.2026 tarihinde başvuru teyidi kontrol edilecek.",
    de: "Die Bewerbung wurde am 17.09.2026 über das ESE-Karriereportal versendet. Der Cybersecurity-Lebenslauf und die zusammengeführte Bewerbungsmappe wurden beigefügt. Gewünschter Eintrittstermin ist der 21.09.2026; am 24.09.2026 wird die Eingangsbestätigung geprüft.",
  },
  "Die Bewerbung wurde am 17.09.2026 über das ESE-Karriereportal versendet. Der Cybersecurity-Lebenslauf und die zusammengeführte Bewerbungsmappe wurden beigefügt. Gewünschter Eintrittstermin ist der 21.09.2026; am 24.09.2026 wird die Eingangsbestätigung geprüft.": {
    tr: "17.09.2026 tarihinde ESE kariyer portalı üzerinden başvuru gönderildi. Siber güvenlik CV’si ve birleştirilmiş başvuru PDF’si eklendi. Başlangıç tarihi 21.09.2026; 24.09.2026 tarihinde başvuru teyidi kontrol edilecek.",
    de: "Die Bewerbung wurde am 17.09.2026 über das ESE-Karriereportal versendet. Der Cybersecurity-Lebenslauf und die zusammengeführte Bewerbungsmappe wurden beigefügt. Gewünschter Eintrittstermin ist der 21.09.2026; am 24.09.2026 wird die Eingangsbestätigung geprüft.",
  },
};

const fallbackReplacements: Array<[RegExp, string, string]> = [
  [/^Gmail yanıtı:/g, "Gmail cevabı:", "Gmail-Antwort:"],
  [/Gesendete E-Mails/g, "Gönderilen e-postalar", "Gesendete E-Mails"],
  [/Eingangsbestätigung/g, "Başvuru alındı teyidi", "Eingangsbestätigung"],
  [/Rückmeldung/g, "geri dönüş", "Rückmeldung"],
  [/abwarten/g, "bekle", "abwarten"],
  [/prüfen|kontrollieren/g, "kontrol et", "prüfen"],
  [/Karriereportal/g, "kariyer portalı", "Karriereportal"],
  [/Bewerbermanagement/g, "başvuru yönetimi", "Bewerbermanagement"],
  [/başvuru yönetimi/g, "başvuru yönetimi", "Bewerbermanagement"],
  [/Başvuru yönetimi/g, "Başvuru yönetimi", "Bewerbermanagement"],
  [/Gönderilen e-postalar/g, "Gönderilen e-postalar", "Gesendete E-Mails"],
  [/İş Ajansı/g, "İş Ajansı", "Arbeitsagentur"],
  [/Gifhorn ilçesi/g, "Gifhorn ilçesi", "Landkreis Gifhorn"],
  [/kariyer portalı/g, "kariyer portalı", "Karriereportal"],
  [/Vollzeit/g, "Tam zamanlı", "Vollzeit"],
  [/ab sofort/g, "hemen başlayabilecek", "ab sofort"],
  [/erfolgreich über das Portal gesendet/g, "portal üzerinden başarıyla gönderildi", "erfolgreich über das Portal gesendet"],
  [/E-Mail/g, "E-posta", "E-Mail"],
  [/E-posta/g, "E-posta", "E-Mail"],
  [/başvuru portalında/g, "başvuru portalında", "im Bewerbungsportal"],
  [/portalda başarıyla gönderildi/g, "portal üzerinden başarıyla gönderildi", "erfolgreich über das Portal gesendet"],
  [/geri dönüş/g, "geri dönüş", "Rückmeldung"],
  [/steht aus/g, "bekleniyor", "steht aus"],
  [/Bewerbung für/g, "başvuru için", "Bewerbung für"],
  [/Stellennummer/g, "ilan numarası", "Stellennummer"],
  [/gesendet/g, "gönderildi", "gesendet"],
  [/EIS-Bewerbungsbogen/g, "EIS başvuru formu", "EIS-Bewerbungsbogen"],
  [/sowie die aktualisierten Unterlagen wurden am/g, "ve güncellenmiş belgeler tarihinde", "sowie die aktualisierten Unterlagen wurden am"],
  [/nachgereicht/g, "sonradan gönderildi", "nachgereicht"],
  [/Antwort:/g, "Yanıt:", "Antwort:"],
  [/Bewerbung als /g, "Başvuru: ", "Bewerbung als "],
  [/ in Gifhorn/g, " Gifhorn'da", " in Gifhorn"],
  [/şirketinde/g, "şirketinde", "bei"],
  [/anfordern/g, "iste", "anfordern"],
  [/nachfassen/g, "takip et", "nachfassen"],
  [/Fehlende Bewerbungsunterlagen nachreichen/g, "Eksik başvuru belgelerini sonradan gönder", "Fehlende Bewerbungsunterlagen nachreichen"],
  [/Keine weitere Aktion – Stelle bereits besetzt/g, "Başka işlem gerekmiyor – pozisyon doldu", "Keine weitere Aktion – Stelle bereits besetzt"],
  [/Keine weitere Aktion – Absage erhalten/g, "Başka işlem gerekmiyor – ret yanıtı alındı", "Keine weitere Aktion – Absage erhalten"],
];

function translate(value: string, language: Language, translations: Record<string, Translation>) {
  const exact = translations[value]?.[language];
  if (exact) return exact;
  return fallbackReplacements.reduce((result, [pattern, tr, de]) => result.replace(pattern, language === "tr" ? tr : de), value);
}

// Free-form notes and Gmail text can arrive in the other language. Never let
// an untranslated value leak into a localized page or report. Known texts are
// translated above; this guard is the final boundary for newly imported text.
const turkishMarkers = /(başvuru|gönderildi|gönderilen|e-posta|geri dönüş|bekleniyor|tarihinde|sonradan|teyidi|portalda|siber güvenlik|birleştirilmiş|başlangıç|kontrol edilecek|üzerinden|eklendi|otomatik|alındı)/i;
const germanMarkers = /(bewerbung|bewerbungs|gesendet|rückmeldung|eingangsbestätigung|nachgereicht|prüfen|prüfe|kontrollieren|abwarten|erhalten|e-mail|karriereportal|stellennummer|unterlagen|automatisch|vorstellungsgespräch|einladung|termin|gespräch|unbekannter|deutscher|einbürgerung|familie|vorabfrage|\bzur\b|\bihre?r?\b|\bauf\b|\bder\b|\bdie\b|\bdas\b|\bund\b|\bfür\b|\bmit\b|\beine?\b|\bist\b|\bwurde\b|\bwerden\b)/i;

function hasForeignLanguage(value: string, language: Language) {
  return language === "de" ? turkishMarkers.test(value) : germanMarkers.test(value);
}

function languageFallback(language: Language) {
  return language === "de"
    ? "Weitere Angaben zur Bewerbung sind im System hinterlegt."
    : "Başvuruya ilişkin ek bilgiler sisteme kaydedildi.";
}

function ensureLanguage(value: string, language: Language, fallback?: string) {
  return hasForeignLanguage(value, language) ? (fallback || languageFallback(language)) : value;
}

function translateMixedContent(value: string, language: Language) {
  const hasTurkish = /(başvuru|gönderildi|e-posta|geri dönüş|bekleniyor|tarihinde|sonradan|teyidi|portalda)/i.test(value);
  const hasGerman = /(bewerbung|gesendet|e-mail|rückmeldung|steht|\beine\b|\bam\s+\d|nachgereicht|eingangsbestätigung|initiativbewerbung)/i.test(value);
  if (!hasTurkish || !hasGerman) return null;
  const date = value.match(/\b\d{2}\.\d{2}\.\d{4}\b/)?.[0];
  if (language === "de") {
    if (/initiativbewerbung/i.test(value)) return `Initiativbewerbung${date ? ` am ${date}` : ""} per E-Mail gesendet; eine Eingangsbestätigung steht noch aus.`;
    return "Bewerbungsunterlagen wurden versendet; die Eingangsbestätigung steht noch aus.";
  }
  if (/initiativbewerbung/i.test(value)) return `${date ? `${date} tarihinde ` : ""}İnisiyatif başvurusu e-posta ile gönderildi; başvuru alındı teyidi henüz gelmedi.`;
  return "Başvuru belgeleri gönderildi; başvuru alındı teyidi henüz gelmedi.";
}

export function localizedSource(value: string | null | undefined, language: Language) {
  if (!value) return value;
  value = value.trim();
  return ensureLanguage(
    translate(value, language, sourceTranslations),
    language,
    language === "de" ? "Bewerbungsquelle" : "Başvuru kaynağı",
  );
}

export function localizedContent(value: string | null | undefined, language: Language) {
  if (!value) return value;
  value = value.trim();
  const gmailReply = value.match(/^Gmail yanıtı:\s*(.+)$/i);
  if (gmailReply) {
    return ensureLanguage(
      language === "de" ? `Gmail-Antwort: ${gmailReply[1]}` : `Gmail cevabı: ${gmailReply[1]}`,
      language,
      language === "de" ? "Gmail-Antwort eingegangen." : "Gmail cevabı alındı.",
    );
  }
  const gmailReplyDe = value.match(/^Gmail-Antwort:\s*(.+)$/i);
  if (gmailReplyDe) {
    return ensureLanguage(
      language === "de" ? value : `Gmail cevabı: ${gmailReplyDe[1]}`,
      language,
      language === "de" ? "Gmail-Antwort eingegangen." : "Gmail cevabı alındı.",
    );
  }
  const gmailNote = value.match(/^Gmail'den otomatik aktarıldı\. E-posta konusu: (.+)$/);
  if (gmailNote) {
    return ensureLanguage(language === "de"
      ? `Automatisch aus Gmail importiert. E-Mail-Betreff: ${gmailNote[1]}`
      : `Gmail'den otomatik aktarıldı. E-posta konusu: ${gmailNote[1]}`, language);
  }
  const gmailNoteDe = value.match(/^Automatisch aus Gmail importiert\. E-Mail-Betreff: (.+)$/);
  if (gmailNoteDe) {
    return ensureLanguage(language === "de"
      ? value
      : `Gmail'den otomatik aktarıldı. E-posta konusu: ${gmailNoteDe[1]}`, language);
  }
  const mixed = translateMixedContent(value, language);
  if (mixed) return mixed;
  if (value.includes("Stellennummer 18049-26")) {
    return language === "de"
      ? "Bewerbung für Stellennummer 18049-26 gesendet. EIS-Bewerbungsbogen sowie die aktualisierten Unterlagen wurden am 11.09.2026 nachgereicht; Rückmeldung steht aus."
      : "18049-26 ilan numarası için başvuru gönderildi. EIS başvuru formu ve güncellenmiş belgeler 11.09.2026 tarihinde sonradan gönderildi; geri dönüş bekleniyor.";
  }
  const statusTitle = value.match(/^Durum: (new|listed|sent|waiting|received|saved|preparing|applied|interview|offer|rejected|withdrawn)$/);
  if (statusTitle) return `${language === "de" ? "Status" : "Durum"}: ${statusLabels[language][statusTitle[1]]}`;
  const statusBody = value.match(/^Başvuru durumu (new|listed|sent|waiting|received|saved|preparing|applied|interview|offer|rejected|withdrawn) olarak güncellendi\.$/);
  if (statusBody) return language === "de" ? `Bewerbungsstatus auf ${statusLabels.de[statusBody[1]]} aktualisiert.` : `Başvuru durumu ${statusLabels.tr[statusBody[1]].toLowerCase()} olarak güncellendi.`;
  return ensureLanguage(translate(value, language, contentTranslations), language);
}

export function localizedLabel(value: string | null | undefined, language: Language, fallback?: string) {
  if (!value) return fallback;
  return ensureLanguage(translate(value, language, contentTranslations), language) || fallback;
}
