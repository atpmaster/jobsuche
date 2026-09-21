import { json } from "../../google-api";

const allowedHosts = ["arbeitsagentur.de", "indeed.com", "linkedin.com", "stepstone.de", "meinestadt.de", "xing.com"];
function clean(value: string) { return value.replace(/\s+/g, " ").replace(/\s*[|–—-]\s*(Indeed|LinkedIn|StepStone|XING|Bundesagentur für Arbeit).*$/i, "").trim().slice(0, 240); }
function hostLabel(host: string) {
  const normalized = host.replace(/^www\./i, "").toLowerCase();
  if (normalized.endsWith("arbeitsagentur.de")) return "Arbeitsagentur";
  if (normalized.endsWith("indeed.com")) return "Indeed";
  if (normalized.endsWith("linkedin.com")) return "LinkedIn";
  if (normalized.endsWith("stepstone.de")) return "StepStone";
  if (normalized.endsWith("meinestadt.de")) return "meinestadt.de";
  if (normalized.endsWith("xing.com")) return "XING";
  return host.replace(/^www\./i, "");
}
function extract(html: string, pattern: RegExp) { const match = html.match(pattern); return match?.[1] ? clean(match[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")) : ""; }

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { url?: string };
    const rawUrl = String(payload.url || "").trim();
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || !allowedHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) return json({ error: "UNSUPPORTED_JOB_SOURCE" }, 400);
    const response = await fetch(url.toString(), { headers: { accept: "text/html,application/xhtml+xml" }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return json({ error: `JOB_PAGE_${response.status}` }, 502);
    const html = (await response.text()).slice(0, 2_000_000);
    const title = extract(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || extract(html, /<title[^>]*>([\s\S]*?)<\/title>/i) || url.pathname.split("/").filter(Boolean).pop() || "Neue Stelle";
    return json({ ok: true, source: hostLabel(host), company: hostLabel(host), role: title, url: url.toString() });
  } catch (error) { return json({ error: error instanceof Error ? error.message : "INVALID_JOB_URL" }, 400); }
}

