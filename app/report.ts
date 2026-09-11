import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

export type ReportRow = { company: string; role: string; location: string; date: string; source: string; status: string; next: string };
export async function buildReport(rows: ReportRow[], language: "tr" | "de", date: string, fonts?: string[], profile?: {customerNumber?:string;signature?:boolean;period?:string}) {
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
    startY: profile?.period ? 56 : 48, margin: { top: profile?.period ? 56 : 48, bottom: profile?.signature ? 35 : 20, left: 14, right: 14 },
    head: [[de ? "Nr." : "No", de ? "Datum der\nBewerbung" : "Başvuru tarihi", de ? "Arbeitgeber / Stelle" : "Kurum / pozisyon", de ? "Quelle / Kanal" : "Kaynak / kanal", de ? "Aktueller Stand" : "Güncel durum", de ? "Nächster Schritt" : "Sonraki adım"]],
    body: rows.map((row, index) => [String(index + 1).padStart(2, "0"), row.date, `${row.company}\n${row.role}${row.location ? `\n${row.location}` : ""}`, row.source, row.status, row.next]),
    theme: "plain", showHead: "everyPage", rowPageBreak: "avoid",
    styles: { font: "NotoSans", fontSize: 9, cellPadding: profile?.period ? 2.2 : 3.2, textColor: [35, 47, 64], lineColor: [222, 228, 235], lineWidth: { bottom: 0.15 }, overflow: "linebreak", valign: "top" },
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
    const fx = 247, fy = 31, fw = 9, fh = 6;
    if (de) {
      [[0,0,0],[221,0,0],[255,206,0]].forEach((rgb, i) => { doc.setFillColor(rgb[0],rgb[1],rgb[2]); doc.rect(fx,fy+i*fh/3,fw,fh/3,"F"); });
    } else {
      doc.setFillColor(227,10,23); doc.rect(fx,fy,fw,fh,"F");
      doc.setFillColor(255,255,255); doc.circle(fx+3.3,fy+3,1.5,"F");
      doc.setFillColor(227,10,23); doc.circle(fx+3.69,fy+3,1.2,"F");
      const points = Array.from({length:10},(_,i)=>{const angle=Math.PI+i*Math.PI/5;const radius=i%2?0.286:0.75;return [fx+5.58+Math.cos(angle)*radius,fy+3+Math.sin(angle)*radius];});
      doc.setFillColor(255,255,255);
      for(let i=0;i<10;i++) doc.triangle(fx+5.58,fy+3,points[i][0],points[i][1],points[(i+1)%10][0],points[(i+1)%10][1],"F");
    }
    doc.text(de ? "Deutsch" : "Türkçe", fx+12, fy+4.3);
    doc.text(`${de ? "Stand" : "Rapor tarihi"}: ${date}`, 283, 26, { align: "right" });
    doc.text(`${rows.length} ${de ? "dokumentierte Einträge" : "kayıt"}  |  ${de ? "Zur Vorlage beim Jobcenter" : "Jobcenter'a sunulmak üzere"}`, 14, 41);
    if(profile?.customerNumber) {doc.setFontSize(8);doc.text(`${de?"Kundennummer":"Müşteri no"}: ${profile.customerNumber.slice(0,40)}`,283,41,{align:"right"});}
    if(profile?.period) {doc.setFontSize(8);doc.text(doc.splitTextToSize(profile.period,269),14,48);}
    if(profile?.signature && page===total) {doc.setDrawColor(110,120,130);doc.setLineWidth(0.2);doc.line(180,183,283,183);doc.setFontSize(8);doc.text(de?"Ort, Datum, Unterschrift":"Yer, tarih, imza",180,188);}
    doc.setDrawColor(210, 220, 230); doc.setLineWidth(0.2); doc.line(14, 194, 283, 194);
    doc.setFontSize(8);
    doc.text(de ? "Zusammenstellung nach den erfassten Angaben. Kein Versandbeleg." : "Sisteme girilen bilgilere göre hazırlanmıştır. Gönderim makbuzu değildir.", 14, 200);
    doc.text(`${de ? "Seite" : "Sayfa"} ${page} / ${total}`, 283, 200, { align: "right" });
  }
  return doc;
}
