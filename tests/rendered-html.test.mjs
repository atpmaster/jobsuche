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
