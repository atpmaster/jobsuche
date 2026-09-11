export function elapsedDays(date:string|null,today:string) {return date?Math.max(0,Math.floor((Date.parse(today)-Date.parse(date))/86400000)):null;}
export function downloadText(text:string,name:string,type:string) {const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function calendarEvent(event:{id:number;startsAt:string;duration:number;location:string|null;notes:string|null},title:string) {
  const esc=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  const compact=(s:string)=>s.replace(/[-:]/g,'')+'00';
  const localEnd=new Date(Date.parse(event.startsAt+'Z')+event.duration*60000).toISOString().slice(0,16);
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Ahmet Tepe//Bewerbungen//DE','BEGIN:VEVENT',`UID:interview-${event.id}@ahmet-bewerbungen`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART;TZID=Europe/Berlin:${compact(event.startsAt)}`,`DTEND;TZID=Europe/Berlin:${compact(localEnd)}`,`SUMMARY:${esc(title)}`,`LOCATION:${esc(event.location||'')}`,`DESCRIPTION:${esc(event.notes||'')}`,'END:VEVENT','END:VCALENDAR',''].join('\r\n');
}
