"use client";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Application } from "./dashboard";
import { editCareerApplication, saveInterview, deleteInterview } from "./career-actions";
import { elapsedDays, calendarEvent, downloadText } from "./career-utils";
import { localizedContent, localizedSource } from "./localization";
import { formatInterviewDetails, getInterviewDetails, isConfirmedInterview } from "./interview-utils";

export type CareerData = {interviews:{id:number;applicationId:number;startsAt:string;duration:number;location:string|null;notes:string|null}[];merges:{sourceId:number;targetId:number;createdAt:string}[]};
function isInterviewApplication(application: Application, career: CareerData) {
  const event = career.interviews.find((item) => item.applicationId === application.id);
  return isConfirmedInterview(application.updates, event?.startsAt);
}
function SaveForm({action,de,children,label}:{action:(data:FormData)=>Promise<void>;de:boolean;children:ReactNode;label?:string}) {
  const [busy,setBusy]=useState(false),[message,setMessage]=useState("");const router=useRouter();
  return <form onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const data=new FormData(form);setBusy(true);setMessage("");try{await action(data);router.refresh();setMessage(de?"Gespeichert.":"Kaydedildi.");}catch{setMessage(de?"Nicht gespeichert. Angaben prüfen und erneut versuchen.":"Kaydedilemedi. Bilgileri kontrol edip yeniden dene.");}finally{setBusy(false);}}}>
    <fieldset disabled={busy}>{children}<button type="submit">{busy?(de?"Wird gespeichert…":"Kaydediliyor…"):(label||(de?"Speichern":"Kaydet"))}</button></fieldset><p role="status">{message}</p>
  </form>;
}
export function CareerTools({applications,career,language,today}:{applications:Application[];career:CareerData;language:"de"|"tr";today:string}) {
  const de=language==="de",active=applications.filter(a=>!a.deletedAt);
  const [selected,setSelected]=useState(""),[month,setMonth]=useState(today.slice(0,7));
  const [draft,setDraft]=useState(""),[draftSubject,setDraftSubject]=useState("");
  const item=active.find(a=>String(a.id)===selected);
  const options=active.map(a=><option key={a.id} value={a.id}>{a.company} — {a.role}</option>);
  const inMonth=active.filter(a=>a.appliedOn?.startsWith(month));
  const interviewInMonth=inMonth.filter(a=>isInterviewApplication(a, career));
  const interviewEventFor=(applicationId:number)=>career.interviews.find(i=>i.applicationId===applicationId);
  const interviewDetailsFor=(application: Application)=>getInterviewDetails(application.updates, interviewEventFor(application.id)?.startsAt);
  const waiting=active.filter(a=>["sent","waiting"].includes(a.status)&&a.appliedOn).sort((a,b)=>(a.appliedOn||"").localeCompare(b.appliedOn||""));
  const choose=(value:string)=>{setSelected(value);setDraft("");setDraftSubject("");};
  const draftEmail=()=>{if(!item)return;setDraftSubject(de?`Nachfrage zu meiner Bewerbung – ${item.role}`:`Başvurum hakkında – ${item.role}`);setDraft(de?`Sehr geehrte Damen und Herren,\n\nam ${item.appliedOn||"[Datum]"} habe ich mich bei ${item.company} für die Position „${item.role}“ beworben. Ich möchte mich höflich nach dem aktuellen Stand meiner Bewerbung erkundigen.\n\nFalls Sie weitere Unterlagen benötigen, reiche ich diese gerne nach.\n\nVielen Dank für Ihre Rückmeldung.\n\nMit freundlichen Grüßen\nAhmet Tepe`:`Sayın Yetkili,\n\n${item.appliedOn||"[Tarih]"} tarihinde ${item.company} kurumundaki ${item.role} pozisyonuna başvurdum. Başvurumun güncel durumu hakkında bilgi rica ederim.\n\nİhtiyaç duyduğunuz ek belgeleri iletmekten memnuniyet duyarım.\n\nTeşekkür ederim.\nSaygılarımla,\nAhmet Tepe`);};
  return <section className="career-tools" aria-label={de?"Bewerbungswerkzeuge":"Başvuru araçları"}>
    <details><summary>{de?"Monatsübersicht":"Aylık özet"}</summary><label>{de?"Monat der Bewerbung":"Başvuru ayı"}<input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label><p>{de?"Auswertung der im gewählten Monat begonnenen Bewerbungen; aktueller Stand. Notizen gelten nicht automatisch als Arbeitgeberantwort.":"Seçilen ayda başlayan başvuruların güncel durumu. Notlar otomatik olarak işveren yanıtı sayılmaz."}</p>
      <div className="career-stats"><span><b>{inMonth.length}</b>{de?"Bewerbungen":"Başvuru"}</span><span><b>{inMonth.filter(a=>["received","interview"].includes(a.status)).length}</b>{de?"Rückmeldung erhalten":"Cevap geldi"}</span><span><b>{interviewInMonth.length}</b>{de?"Vorstellungsgespräch-Einladungen":"Mülakat daveti"}</span></div>
      <table><thead><tr><th>{de?"Bereich":"Alan"}</th><th>{de?"Bewerbungen":"Başvuru"}</th><th>{de?"Rückmeldung":"Cevap"}</th></tr></thead><tbody>{["teaching","cyber","other"].map(track=><tr key={track}><td>{track==="teaching"?(de?"Bildung":"Eğitim"):track==="cyber"?(de?"Cybersecurity":"Siber güvenlik"):(de?"Sonstige":"Diğer")}</td><td>{inMonth.filter(a=>a.track===track).length}</td><td>{inMonth.filter(a=>a.track===track&&["received","interview"].includes(a.status)).length}</td></tr>)}</tbody></table>
      <section className="monthly-interviews" aria-label={de?"Vorstellungsgespräch-Einladungen":"Mülakat davetleri"}><h3>{de?"Vorstellungsgespräch-Einladungen und Termine":"Mülakat davetleri ve tarihleri"}</h3>{interviewInMonth.length?<div>{interviewInMonth.map(a=><article key={a.id}><strong>{a.company}</strong><span>{a.role}</span><small>{formatInterviewDetails(interviewDetailsFor(a), language)}</small></article>)}</div>:<p>{de?"Keine Vorstellungsgespräch-Einladung im ausgewählten Monat.":"Seçilen ayda mülakat daveti yok."}</p>}</section>
    </details>
    <details><summary>{de?"Nachfassen und Bewerbung bearbeiten":"Takip taslağı ve başvuru düzenleme"}</summary>
      <p>{de?"Tage seit der Erstbewerbung; kein Nachweis einer ausgebliebenen Antwort.":"İlk başvurudan itibaren geçen süre; yanıt gelmediğinin kanıtı değildir."}</p>
      <ul>{waiting.map(a=><li key={a.id}><button type="button" onClick={()=>choose(String(a.id))}>{a.company} · {elapsedDays(a.appliedOn,today)} {de?"Tage":"gün"}</button></li>)}</ul>
      <label>{de?"Bewerbung auswählen":"Başvuru seç"}<select value={selected} onChange={e=>choose(e.target.value)}><option value="">{de?"Bitte auswählen":"Seçiniz"}</option>{options}</select></label>
      {item&&<div key={item.id}>
        <button type="button" onClick={draftEmail}>{de?"Nachfass-E-Mail entwerfen":"Takip e-postası taslağı oluştur"}</button>
        {draft&&<div className="draft-editor"><label>{de?"Betreff":"Konu"}<input value={draftSubject} onChange={e=>setDraftSubject(e.target.value)}/></label><label>{de?"Entwurf – vor dem Senden prüfen":"Taslak — göndermeden önce kontrol et"}<textarea rows={12} value={draft} onChange={e=>setDraft(e.target.value)}/></label><button type="button" onClick={()=>downloadText(`${draftSubject}\n\n${draft}`,"Nachfassen.txt","text/plain;charset=utf-8")}>{de?"Entwurf herunterladen":"Taslağı indir"}</button>{item.contactEmail&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.contactEmail)&&<a href={`mailto:${encodeURIComponent(item.contactEmail)}?subject=${encodeURIComponent(draftSubject)}&body=${encodeURIComponent(draft)}`}>{de?"Im E-Mail-Programm prüfen (nicht gesendet)":"E-posta uygulamasında gözden geçir (gönderilmez)"}</a>}</div>}
        <details><summary>{de?"Bewerbungsdaten bearbeiten":"Başvuru bilgilerini düzenle"}</summary><SaveForm action={editCareerApplication} de={de}><input type="hidden" name="id" value={item.id}/><div className="career-form-grid">{[
          ["company",de?"Arbeitgeber":"Kurum",item.company],["role",de?"Position":"Pozisyon",item.role],["location",de?"Ort":"Konum",item.location],["contact_name",de?"Kontaktperson":"İletişim kişisi",item.contactName],["contact_email","E-Mail",item.contactEmail],["contact_phone",de?"Telefon":"Telefon",item.contactPhone],["applied_on",de?"Erstbewerbung am":"İlk başvuru tarihi",item.appliedOn],["next_action",de?"Nächster Schritt":"Sonraki adım",localizedContent(item.nextAction,language)],["next_action_date",de?"Nachfassen am":"Takip tarihi",item.nextActionDate]
        ].map(([key,label,value])=><label key={key!}>{label}<input name={key!} required={key==="company"||key==="role"} type={key==="applied_on"||key==="next_action_date"?"date":key==="contact_email"?"email":"text"} defaultValue={key==="source"?localizedSource(String(value||""),language):value||""}/></label>)}</div><label>{de?"Notizen":"Notlar"}<textarea name="notes" defaultValue={localizedContent(item.notes,language)||""}/></label></SaveForm></details>
      </div>}
    </details>
    <details><summary>{de?"Vorstellungsgespräche und Kalender":"Mülakatlar ve takvim"}</summary><p>{de?"Zeitzone: Europe/Berlin. Angaben sind auf dieser Website für Linkbesitzer sichtbar.":"Saat dilimi: Europe/Berlin. Buraya eklenen bilgiler site bağlantısına sahip kişilerce görülebilir."}</p>
      {career.interviews.filter(i=>active.some(a=>a.id===i.applicationId||career.merges.some(m=>m.sourceId===i.applicationId&&m.targetId===a.id))).map(event=><article className="interview-card" key={event.id}><h3>{applications.find(a=>a.id===event.applicationId)?.company}</h3><p>{event.startsAt.replace("T"," · ")} · {event.duration} {de?"Min.":"dk"}</p><p>{event.location}</p><p>{event.notes}</p><button type="button" onClick={()=>downloadText(calendarEvent(event,`${de?"Vorstellungsgespräch":"Mülakat"} – ${applications.find(a=>a.id===event.applicationId)?.company||""}`),`interview-${event.id}.ics`,"text/calendar;charset=utf-8")}>{de?"Zum Kalender hinzufügen (.ics)":"Takvime ekle (.ics)"}</button><details><summary>{de?"Termin entfernen":"Randevuyu kaldır"}</summary><SaveForm action={deleteInterview} de={de} label={de?"Entfernen bestätigen":"Kaldırmayı onayla"}><input type="hidden" name="id" value={event.id}/></SaveForm></details></article>)}
      <SaveForm action={saveInterview} de={de} label={de?"Gespräch speichern":"Mülakatı kaydet"}><div className="career-form-grid"><label>{de?"Bewerbung":"Başvuru"}<select name="applicationId" required defaultValue=""><option value="">{de?"Bitte auswählen":"Seçiniz"}</option>{options}</select></label><label>{de?"Datum und Uhrzeit":"Tarih ve saat"}<input required type="datetime-local" name="startsAt"/></label><label>{de?"Dauer (Minuten)":"Süre (dakika)"}<input required type="number" name="duration" min="15" max="480" defaultValue="60"/></label><label>{de?"Adresse / Besprechungslink":"Adres / toplantı bağlantısı"}<input name="location"/></label></div><label>{de?"Vorbereitungsnotizen":"Hazırlık notları"}<textarea name="notes"/></label></SaveForm>
    </details>
  </section>;
}
