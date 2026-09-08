"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function LiveRefresh() {
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      router.refresh();
      setLastRefresh(new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }));
    };
    const timer = window.setInterval(refresh, 45_000);
    return () => window.clearInterval(timer);
  }, [router]);

  return (
    <button className="live-control" type="button" onClick={() => { router.refresh(); setLastRefresh(new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })); }} title="Başvuruları şimdi yenile">
      <span className="live-dot" />
      <span><strong>Canlı</strong><small>{lastRefresh ? `${lastRefresh} yenilendi` : "45 sn'de yenilenir"}</small></span>
      <span className="refresh-icon">↻</span>
    </button>
  );
}
