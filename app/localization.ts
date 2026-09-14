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
    interview: "Cevap geldi",
    offer: "Cevap geldi",
    rejected: "Cevap geldi",
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
    interview: "Rückmeldung erhalten",
    offer: "Rückmeldung erhalten",
    rejected: "Rückmeldung erhalten",
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
  "Fehlende Bewerbungsunterlagen nachreichen": { tr: "Eksik başvuru belgelerini sonradan gönder", de: "Fehlende Bewerbungsunterlagen nachreichen" },
  "geri dönüş nachfassen": { tr: "Geri dönüşü takip et", de: "Rückmeldung nachfassen" },
  "Keine weitere Aktion – Stelle bereits besetzt": { tr: "Başka işlem gerekmiyor – pozisyon doldu", de: "Keine weitere Aktion – Stelle bereits besetzt" },
  "Keine weitere Aktion – Absage erhalten": { tr: "Başka işlem gerekmiyor – ret yanıtı alındı", de: "Keine weitere Aktion – Absage erhalten" },
  "Bewerbung für Stellennummer 18049-26 gesendet. EIS-Bewerbungsbogen sowie die aktualisierten Unterlagen wurden am 11.09.2026 nachgereicht; geri dönüş steht aus.": { tr: "18049-26 ilan numarası için başvuru gönderildi. EIS başvuru formu ve güncellenmiş belgeler 11.09.2026 tarihinde sonradan gönderildi; geri dönüş bekleniyor.", de: "Bewerbung für Stellennummer 18049-26 gesendet. EIS-Bewerbungsbogen sowie die aktualisierten Unterlagen wurden am 11.09.2026 nachgereicht; Rückmeldung steht aus." },
  "Gmail yanıtı:": { tr: "Gmail cevabı:", de: "Gmail-Antwort:" },
  "Geri dönüşü kontrol et": { tr: "Geri dönüşü kontrol et", de: "Rückmeldung prüfen" },
  "Geri dönüşü bekle": { tr: "Geri dönüşü bekle", de: "Rückmeldung abwarten" },
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

export function localizedSource(value: string | null | undefined, language: Language) {
  if (!value) return value;
  return translate(value, language, sourceTranslations);
}

export function localizedContent(value: string | null | undefined, language: Language) {
  if (!value) return value;
  if (value.includes("Stellennummer 18049-26")) {
    return language === "de"
      ? "Bewerbung für Stellennummer 18049-26 gesendet. EIS-Bewerbungsbogen sowie die aktualisierten Unterlagen wurden am 11.09.2026 nachgereicht; Rückmeldung steht aus."
      : "18049-26 ilan numarası için başvuru gönderildi. EIS başvuru formu ve güncellenmiş belgeler 11.09.2026 tarihinde sonradan gönderildi; geri dönüş bekleniyor.";
  }
  const statusTitle = value.match(/^Durum: (new|listed|sent|waiting|received|saved|preparing|applied|interview|offer|rejected|withdrawn)$/);
  if (statusTitle) return `${language === "de" ? "Status" : "Durum"}: ${statusLabels[language][statusTitle[1]]}`;
  const statusBody = value.match(/^Başvuru durumu (new|listed|sent|waiting|received|saved|preparing|applied|interview|offer|rejected|withdrawn) olarak güncellendi\.$/);
  if (statusBody) return language === "de" ? `Bewerbungsstatus auf ${statusLabels.de[statusBody[1]]} aktualisiert.` : `Başvuru durumu ${statusLabels.tr[statusBody[1]].toLowerCase()} olarak güncellendi.`;
  return translate(value, language, contentTranslations);
}
