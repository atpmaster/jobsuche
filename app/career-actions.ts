"use server";
import { env } from "cloudflare:workers";
import { revalidatePath } from "next/cache";

const str = (data:FormData,key:string) => String(data.get(key)||"").trim();
const id = (data:FormData,key="id") => {const v=Number(data.get(key));if(!Number.isSafeInteger(v)||v<1)throw Error("INVALID_ID");return v;};
const date = (v:string) => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(v).toISOString().slice(0,10)===v);
export async function getCareerData() {
  const [interviews,merges]=await Promise.all([
    env.DB.prepare("SELECT id, application_id AS applicationId, starts_at AS startsAt, duration, location, notes FROM interviews ORDER BY starts_at").all<{id:number;applicationId:number;startsAt:string;duration:number;location:string|null;notes:string|null}>(),
    env.DB.prepare("SELECT source_id AS sourceId, target_id AS targetId, created_at AS createdAt FROM application_merges").all<{sourceId:number;targetId:number;createdAt:string}>()
  ]);
  return {interviews:interviews.results,merges:merges.results};
}
export async function editCareerApplication(data:FormData) {
  const keys=["company","role","location","contact_name","contact_email","contact_phone","applied_on","next_action","next_action_date","notes"];
  if(!str(data,"company")||!str(data,"role")||!date(str(data,"applied_on"))||!date(str(data,"next_action_date")))throw Error("INVALID_INPUT");
  await env.DB.prepare(`UPDATE applications SET ${keys.map(k=>`${k} = ?`).join(",")} WHERE id = ? AND deleted_at IS NULL`).bind(...keys.map(k=>str(data,k)||null),id(data)).run();
  revalidatePath("/");
}
export async function saveInterview(data:FormData) {
  const startsAt=str(data,"startsAt"),duration=Number(data.get("duration"));
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startsAt)||!Number.isFinite(Date.parse(startsAt))||!Number.isInteger(duration)||duration<15||duration>480)throw Error("INVALID_INPUT");
  await env.DB.prepare("INSERT INTO interviews (application_id,starts_at,duration,location,notes) SELECT id,?,?,?,? FROM applications WHERE id=? AND deleted_at IS NULL")
    .bind(startsAt,duration,str(data,"location"),str(data,"notes"),id(data,"applicationId")).run();
  revalidatePath("/");
}
export async function deleteInterview(data:FormData) {
  await env.DB.prepare("DELETE FROM interviews WHERE id=?").bind(id(data)).run();revalidatePath("/");
}
export async function mergeApplications(data:FormData) {
  const source=id(data,"sourceId"),target=id(data,"targetId");
  if(source===target||data.get("confirmed")!=="yes")throw Error("CONFIRM_REQUIRED");
  // Keep source rows, steps and events intact. A reversible link supplies the combined view.
  const result = await env.DB.batch([
    env.DB.prepare(`INSERT INTO application_merges(source_id,target_id)
      SELECT s.id,t.id FROM applications s,applications t WHERE s.id=? AND t.id=? AND s.deleted_at IS NULL AND t.deleted_at IS NULL
      AND NOT EXISTS(SELECT 1 FROM application_merges WHERE source_id IN (?,?) OR target_id=?)`)
      .bind(source,target,source,target,source),
    env.DB.prepare("UPDATE applications SET deleted_at=CURRENT_TIMESTAMP WHERE id=? AND EXISTS(SELECT 1 FROM application_merges WHERE source_id=? AND target_id=?)").bind(source,source,target)
  ]);
  if(!result[0].meta.changes)throw Error("MERGE_CONFLICT");
  revalidatePath("/");
}
export async function undoMerge(data:FormData) {
  const source=id(data,"sourceId");
  await env.DB.batch([
    env.DB.prepare("UPDATE applications SET deleted_at=NULL WHERE id=? AND EXISTS(SELECT 1 FROM application_merges WHERE source_id=?)").bind(source,source),
    env.DB.prepare("DELETE FROM application_merges WHERE source_id=?").bind(source)
  ]);revalidatePath("/");
}
