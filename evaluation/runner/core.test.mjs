import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  hash,
  assertApproved,
  cost,
  citationCheck,
  Budget,
  escapeHTML,
} from "./core.mjs";
test("privacy approval is bound to exact reviewed text", () => {
  const c = {
    id: "1",
    question: "Generic question",
    privacy: {
      status: "approved",
      reviewedBy: "test",
      questionHash: hash("Generic question"),
    },
  };
  assertApproved([c]);
  assert.throws(() => assertApproved([{ ...c, question: "changed" }]));
  assert.throws(() =>
    assertApproved([{ ...c, privacy: { status: "pending" } }]),
  );
});
test("cost accounts for cached reads, cache writes, and reasoning as output", () => {
  assert.equal(
    cost("gpt-5.6-terra", {
      input_tokens: 1000000,
      output_tokens: 1000000,
      input_tokens_details: {
        cached_tokens: 100000,
        cache_write_tokens: 200000,
      },
    }),
    0.7 * 2.2 + 0.1 * 0.22 + 0.2 * 2.75 + 13.2,
  );
});
test("budget reserves concurrent work and persists failed/unknown charges", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pw-eval-test-"));
  try {
    const file = path.join(dir, "ledger.json");
    const b = new Budget(file, 1);
    const a = b.reserve("a", 0.7);
    assert.throws(() => b.reserve("b", 0.4));
    b.settle(a, 0.2);
    b.reserve("b", 0.4);
    assert.ok(new Budget(file, 1).total() > 0.59);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});
test("citation checks identify hallucinated references", () => {
  assert.deepEqual(
    citationCheck("Claim [^7]\n## Citations\n[^0]: source", [{ docNumber: 0 }])
      .unknown,
    [7],
  );
  assert.equal(citationCheck("Claim <c:0>", []).unprocessed, true);
});
test("report escapes untrusted source content", () =>
  assert.equal(escapeHTML('<script>"&'), "&lt;script&gt;&quot;&amp;"));
