import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("kişisel takip sistemi ve kalıcı veri katmanı hazır", async () => {
  const [page, actions, hosting, gmailSync, interviewUtils] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/actions.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../app/gmail-sync.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/interview-utils.ts", import.meta.url), "utf8"),
  ]);
  assert.match(page, /Ahmet Tepe/);
  assert.match(page, /Başvuru takibi/);
  assert.match(actions, /CREATE TABLE IF NOT EXISTS applications/);
  assert.match(actions, /gmail_thread_id/);
  assert.match(gmailSync, /message\.threadId/);
  assert.match(gmailSync, /const replyIds = \[\.\.\.new Set\(\[\.\.\.sentReplyIds, \.\.\.inboxIds\]\)\]/);
  assert.match(gmailSync, /const sentReplyIds = sentIds\.filter/);
  assert.match(gmailSync, /Mülakat teyidi/);
  assert.match(interviewUtils, /confirmationWords/);
  assert.equal(JSON.parse(hosting).d1, "DB");
});

test("dil sınırı ve filtreli PDF kapsamları ayrıdır", async () => {
  const [dashboard, localization, report] = await Promise.all([
    readFile(new URL("../app/dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/localization.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/report.ts", import.meta.url), "utf8"),
  ]);
  assert.match(dashboard, /type PdfScope = "all" \| "interview" \| "rejected" \| "withoutInterview"/);
  assert.match(dashboard, /pdfScope === "rejected"/);
  assert.match(dashboard, /Sadece ret \/ olumsuz cevaplar/);
  assert.match(dashboard, /localizedNextAction/);
  assert.match(dashboard, /EMPTY_REPORT/);
  assert.match(localization, /Vorstellungsgespräch bestätigt; auf das Gespräch vorbereiten/);
  assert.match(localization, /mülakat\|görüşme\|hazırlan/);
  assert.match(report, /Klassifizierung der Rückmeldung/);
});
