"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { correctApplicationDate } from "./actions";
export function DateEditor({id,date,language}:{id:number;date:string|null;language:"de"|"tr"}) {
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const router=useRouter();
  const de=language==="de";
  return <form className="date-editor" action={async data=>{setBusy(true);setMessage("");try{await correctApplicationDate(data);router.refresh();setMessage(de?"Gespeichert":"Kaydedildi");}catch{setMessage(de?"Nicht gespeichert. Bitte erneut versuchen.":"Kaydedilemedi. Yeniden dene.");}finally{setBusy(false);}}}>
    <input type="hidden" name="id" value={id}/><label>{de?"Datum der Erstbewerbung":"İlk başvuru tarihi"}<input required type="date" name="appliedOn" defaultValue={date||""}/></label>
    <small>{de?"Nachgereichte Unterlagen gehören in den Verlauf und ändern dieses Datum nicht.":"Ek belge gönderimlerini geçmişe ekle; ilk başvuru tarihini değiştirme."}</small><button disabled={busy} type="submit">{de?"Datum speichern":"Tarihi kaydet"}</button><span role="status">{message}</span>
  </form>;
}
