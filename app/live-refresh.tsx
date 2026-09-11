"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function LiveRefresh({ language }: { language: "tr" | "de" }) {
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const locale = language === "de" ? "de-DE" : "tr-TR";
  const liveLabel = language === "de" ? "Live" : "Canlı";
  const refreshLabel = language === "de" ? "45 Sek. Aktualisierung" : "45 sn'de yenilenir";
  const refreshedLabel = language === "de" ? "aktualisiert" : "yenilendi";
  const title = language === "de" ? "Bewerbungen jetzt aktualisieren" : "Başvuruları şimdi yenile";

  useEffect(() => {
    const refresh = () => {
      router.refresh();
      setLastRefresh(new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }));
    };
    const timer = window.setInterval(refresh, 45_000);
    return () => window.clearInterval(timer);
  }, [locale, router]);

  return (
    <button className="live-control" type="button" onClick={() => { router.refresh(); setLastRefresh(new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })); }} title={title}>
      <span className="live-dot" />
      <span><strong>{liveLabel}</strong><small>{lastRefresh ? `${lastRefresh} ${refreshedLabel}` : refreshLabel}</small></span>
      <span className="refresh-icon">↻</span>
    </button>
  );
}
