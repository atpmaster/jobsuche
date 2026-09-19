import { env } from "cloudflare:workers";

const allowedOrigins = new Set([
  "http://127.0.0.1:4174",
  "http://localhost:4174",
]);

function responseHeaders(request: Request) {
  const origin = request.headers.get("Origin");
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store, max-age=0",
    "vary": "Origin",
  });
  if (origin && allowedOrigins.has(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-methods", "GET, OPTIONS");
    headers.set("access-control-allow-headers", "content-type");
  }
  return headers;
}

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: responseHeaders(request) });
}

export async function GET(request: Request) {
  const rows = await env.DB.prepare(`
    SELECT id, company, role, track, location, score, status,
      applied_on AS appliedOn, source, url, next_action AS nextAction,
      next_action_date AS nextActionDate
    FROM applications
    WHERE deleted_at IS NULL
      AND (feedback IS NULL
        OR (feedback NOT LIKE 'Mükerrer Gmail kaydı;%' AND feedback NOT LIKE 'Gelen cevap; ayrı bir başvuru değil.%' AND feedback NOT LIKE 'Kein Bewerbungsvorgang:%'))
    ORDER BY COALESCE(applied_on, created_at) DESC, id DESC
  `).all<{
    id: number;
    company: string;
    role: string;
    track: string;
    location: string | null;
    score: number;
    status: string;
    appliedOn: string | null;
    source: string | null;
    url: string | null;
    nextAction: string | null;
    nextActionDate: string | null;
  }>();

  const applications = rows.results.map((row) => ({
    id: row.id,
    company: row.company,
    role: row.role,
    track: row.track,
    location: row.location,
    score: row.score,
    status: row.status,
    appliedOn: row.appliedOn,
    source: row.source,
    url: row.url,
    nextAction: row.nextAction,
    nextActionDate: row.nextActionDate,
  }));

  return new Response(JSON.stringify({
    source: "Ahmet Tepe Başvuru Merkezi",
    fetchedAt: new Date().toISOString(),
    refreshIntervalSeconds: 45,
    applications,
  }), { headers: responseHeaders(request) });
}
