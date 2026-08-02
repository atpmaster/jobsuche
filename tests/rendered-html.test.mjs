import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("kişisel takip sistemi ve kalıcı veri katmanı hazır", async () => {
  const [page, actions, hosting] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/actions.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /Ahmet Tepe/);
  assert.match(page, /Başvuru takibi/);
  assert.match(actions, /CREATE TABLE IF NOT EXISTS applications/);
  assert.equal(JSON.parse(hosting).d1, "DB");
});
