const MAX_SESSION_AGE = 8 * 60 * 60;

const APPS = [
  {
    title: "Başvuru Takip Merkezi",
    description: "İş başvuruları, cevaplar ve raporlar",
    url: "https://atpjobhunter.yapay-zeka-e-5918.chatgpt.site/",
  },
  {
    title: "ATPSEC",
    description: "Siber güvenlik ve IT portföyü",
    url: "https://atpsec.online/",
  },
  {
    title: "Mülakat Hazırlama Portalı",
    description: "Mülakat senaryoları ve prova araçları",
    url: "https://mulakat-hazirlanma-portali.yapay-zeka-e-5918.chatgpt.site/",
  },
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    if (method === "POST" && url.pathname === "/login") {
      return handleLogin(request, env);
    }

    if (url.pathname === "/logout") {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
          "Set-Cookie": "portal_session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax",
        },
      });
    }

    const authenticated = await hasValidSession(request, env);
    if (!authenticated) {
      return htmlResponse(loginPage(env.GATEWAY_PASSWORD ? "" : "Kurulum bekleniyor"), 401);
    }

    return htmlResponse(portalPage());
  },
};

async function handleLogin(request, env) {
  if (!env.GATEWAY_PASSWORD) {
    return htmlResponse(loginPage("Cloudflare Secret GATEWAY_PASSWORD henüz ayarlanmadı."), 503);
  }

  const form = await request.formData();
  const submitted = String(form.get("password") || "");
  if (!(await sameSecret(submitted, env.GATEWAY_PASSWORD))) {
    return htmlResponse(loginPage("Şifre hatalı. Lütfen tekrar deneyin."), 401);
  }

  const expires = Math.floor(Date.now() / 1000) + MAX_SESSION_AGE;
  const payload = String(expires);
  const signature = await sign(payload, env.GATEWAY_PASSWORD);
  const cookie = `portal_session=${base64Url(`${payload}.${signature}`)}; Max-Age=${MAX_SESSION_AGE}; Path=/; HttpOnly; Secure; SameSite=Lax`;

  return new Response(null, {
    status: 302,
    headers: { Location: "/", "Set-Cookie": cookie },
  });
}

async function hasValidSession(request, env) {
  if (!env.GATEWAY_PASSWORD) return false;
  const cookies = request.headers.get("Cookie") || "";
  const match = cookies.match(/(?:^|;\s*)portal_session=([^;]+)/);
  if (!match) return false;

  try {
    const decoded = atob(match[1].replace(/-/g, "+").replace(/_/g, "/"));
    const [expires, signature] = decoded.split(".");
    if (!expires || !signature || Number(expires) < Math.floor(Date.now() / 1000)) return false;
    return await sameSecret(signature, await sign(expires, env.GATEWAY_PASSWORD));
  } catch {
    return false;
  }
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
  return base64Url(String.fromCharCode(...bytes));
}

async function sameSecret(left, right) {
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(left)),
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(right)),
  ]);
  const leftBytes = new Uint8Array(a);
  const rightBytes = new Uint8Array(b);
  if (leftBytes.length !== rightBytes.length) return false;
  let difference = 0;
  for (let i = 0; i < leftBytes.length; i += 1) difference |= leftBytes[i] ^ rightBytes[i];
  return difference === 0;
}

function base64Url(value) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
    },
  });
}

function loginPage(message = "") {
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ahmet Tepe · Güvenli Portal</title><style>${styles()}</style></head>
<body><main class="card"><div class="mark">AT</div><h1>Güvenli Portal</h1><p class="muted">Projelerime erişmek için ortak portal şifrenizi girin.</p>
${message ? `<div class="message">${escapeHtml(message)}</div>` : ""}
<form method="post" action="/login"><label for="password">Portal şifresi</label><input id="password" name="password" type="password" minlength="12" maxlength="12" autocomplete="current-password" required><button type="submit">Giriş yap</button></form>
<p class="hint">Şifre 12 karakter olmalıdır.</p></main></body></html>`;
}

function portalPage() {
  const cards = APPS.map((app) => `<a class="app" href="${app.url}" rel="noopener"><strong>${app.title}</strong><span>${app.description}</span><b>Aç →</b></a>`).join("");
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ahmet Tepe · Portal</title><style>${styles()}</style></head>
<body><main class="shell"><header><div><div class="eyebrow">AHMET TEPE</div><h1>Projelerim</h1><p class="muted">Tek girişle bağlı çalışma alanlarına erişin.</p></div><a class="logout" href="/logout">Çıkış yap</a></header><section class="grid">${cards}</section><footer>Ortak portal girişi Cloudflare Worker ile korunmaktadır.</footer></main></body></html>`;
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function styles() {
  return `:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;color:#13233d;background:#eef3f8}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at top,#fff 0,#eef3f8 55%,#e2eaf2 100%)}.card,.shell{width:min(100%,760px);background:rgba(255,255,255,.94);border:1px solid #d9e3ee;border-radius:24px;box-shadow:0 20px 60px rgba(24,48,80,.14);padding:36px}.card{max-width:440px;text-align:center}.mark{width:58px;height:58px;display:grid;place-items:center;margin:0 auto 20px;border-radius:18px;background:#2266d6;color:#fff;font-weight:800;letter-spacing:.04em}h1{margin:0 0 10px;font-size:clamp(28px,5vw,42px);letter-spacing:-.04em}.muted{color:#63748b;line-height:1.55}.message{margin:18px 0;padding:12px 14px;border-radius:12px;background:#fff1ed;color:#a43d2b;font-size:14px;text-align:left}form{display:grid;gap:10px;margin-top:24px;text-align:left}label{font-size:14px;font-weight:700}input{width:100%;border:1px solid #b9c9dc;border-radius:12px;padding:13px 14px;font-size:17px;letter-spacing:.12em}button{border:0;border-radius:12px;padding:13px 16px;background:#2266d6;color:#fff;font-size:16px;font-weight:700;cursor:pointer}.hint{font-size:12px;color:#8290a0;margin:16px 0 0}.shell{max-width:960px}header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:28px}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.16em;color:#2266d6}.logout{color:#2266d6;text-decoration:none;font-weight:700}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}.app{display:flex;flex-direction:column;gap:10px;padding:22px;border:1px solid #d5e1ef;border-radius:18px;background:#f8fbff;color:#13233d;text-decoration:none;transition:transform .15s,box-shadow .15s}.app:hover{transform:translateY(-2px);box-shadow:0 10px 25px rgba(34,102,214,.12)}.app strong{font-size:18px}.app span{color:#64758b;line-height:1.45;min-height:44px}.app b{color:#2266d6}footer{margin-top:28px;color:#8795a6;font-size:12px;text-align:center}@media(max-width:560px){.card,.shell{padding:24px;border-radius:18px}header{display:block}.logout{display:inline-block;margin-top:16px}}`;
}
