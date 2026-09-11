import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

export type ReportRow = { company: string; role: string; location: string; date: string; source: string; status: string; next: string };
export async function buildReport(rows: ReportRow[], language: "tr" | "de", date: string, fonts?: string[]) {
  const de = language === "de";
  const doc = new jsPDF({ orientation: "landscape", format: "a4", compress: true });
  const fontData = fonts ?? await Promise.all(["Regular", "Bold"].map(async weight => {
    const response = await fetch(`/fonts/NotoSans-${weight}.ttf`);
    if (!response.ok) throw new Error("Font unavailable");
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(binary);
  }));
  fontData.forEach((data, index) => {
    const name = `NotoSans-${index}.ttf`;
    doc.addFileToVFS(name, data);
    doc.addFont(name, "NotoSans", index ? "bold" : "normal");
  });
  doc.setProperties({ title: de ? "Bewerbungsnachweis - Ahmet Tepe" : "Başvuru Raporu - Ahmet Tepe", author: "Ahmet Tepe" });
  autoTable(doc, {
    startY: 48, margin: { top: 48, bottom: 20, left: 14, right: 14 },
    head: [[de ? "Nr." : "No", de ? "Datum der\nBewerbung" : "Başvuru tarihi", de ? "Arbeitgeber / Stelle" : "Kurum / pozisyon", de ? "Quelle / Kanal" : "Kaynak / kanal", de ? "Aktueller Stand" : "Güncel durum", de ? "Nächster Schritt" : "Sonraki adım"]],
    body: rows.map((row, index) => [String(index + 1).padStart(2, "0"), row.date, `${row.company}\n${row.role}${row.location ? `\n${row.location}` : ""}`, row.source, row.status, row.next]),
    theme: "plain", showHead: "everyPage", rowPageBreak: "avoid",
    styles: { font: "NotoSans", fontSize: 9, cellPadding: 3.2, textColor: [35, 47, 64], lineColor: [222, 228, 235], lineWidth: { bottom: 0.15 }, overflow: "linebreak", valign: "top" },
    headStyles: { fillColor: [23, 43, 67], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
    alternateRowStyles: { fillColor: [245, 248, 251] },
    columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 29 }, 2: { cellWidth: 86 }, 3: { cellWidth: 39 }, 4: { cellWidth: 37 }, 5: { cellWidth: 66 } },
  });
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    doc.setDrawColor(27, 93, 185); doc.setLineWidth(1.2); doc.line(14, 13, 283, 13);
    doc.setFont("NotoSans", "bold"); doc.setTextColor(23, 43, 67); doc.setFontSize(21);
    doc.text(de ? "Nachweis der Bewerbungsaktivitäten" : "İş Başvuruları Raporu", 14, 26);
    doc.setFontSize(10); doc.text("Ahmet Tepe", 14, 35);
    doc.setFont("NotoSans", "normal"); doc.setTextColor(85, 99, 117); doc.setFontSize(9);
    doc.text(`${de ? "Stand" : "Rapor tarihi"}: ${date}`, 283, 26, { align: "right" });
    doc.text(`${rows.length} ${de ? "dokumentierte Einträge" : "kayıt"}  |  ${de ? "Zur Vorlage beim Jobcenter" : "Jobcenter'a sunulmak üzere"}`, 14, 41);
    doc.setDrawColor(210, 220, 230); doc.setLineWidth(0.2); doc.line(14, 194, 283, 194);
    doc.setFontSize(8);
    doc.text(de ? "Zusammenstellung nach den erfassten Angaben. Kein Versandbeleg." : "Sisteme girilen bilgilere göre hazırlanmıştır. Gönderim makbuzu değildir.", 14, 200);
    doc.text(`${de ? "Seite" : "Sayfa"} ${page} / ${total}`, 283, 200, { align: "right" });
  }
  return doc;
}
