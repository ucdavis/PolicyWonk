import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { report } from "./report.mjs";
import { writeJSON, variants } from "./core.mjs";

test("reports include only manifest answers and their judges, and escape question HTML", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pw-report-"));
  try {
    fs.mkdirSync(path.join(dir, "results"));
    writeJSON(path.join(dir, "dataset.json"), {
      hash: "test",
      cases: [
        {
          id: "q1",
          category: "production",
          question: "<script>bad</script>",
          focus: { name: "core" },
        },
      ],
    });
    writeJSON(path.join(dir, "run-manifest.json"), {
      expectedCases: ["q1"],
      answerKeys: ["new", "candidate"],
    });
    writeJSON(path.join(dir, "ledger.json"), []);
    const answer = {
      kind: "answer",
      caseId: "q1",
      repeat: 0,
      ok: true,
      variant: variants[0],
      cacheKey: "new",
      firstTextMs: 10,
      totalMs: 100,
      cost: 0.1,
      usage: {
        output_tokens: 5,
        output_tokens_details: { reasoning_tokens: 1 },
      },
      citations: { unknown: [], unprocessed: false },
    };
    writeJSON(path.join(dir, "results/new.json"), answer);
    writeJSON(path.join(dir, "results/stale.json"), {
      ...answer,
      cacheKey: "old",
      totalMs: 900000,
    });
    writeJSON(path.join(dir, "results/candidate.json"), {
      ...answer,
      cacheKey: "candidate",
      variant: variants[1],
    });
    const score = {
      relevance: 4,
      completeness: 4,
      grounding: 4,
      citation_support: 4,
      uncertainty: 4,
      severe: false,
    };
    const judge = {
      kind: "judge",
      caseId: "q1",
      category: "production",
      ok: true,
      baselineCacheKey: "new",
      candidateCacheKey: "candidate",
      candidate: variants[1].id,
      A: variants[0].id,
      B: variants[1].id,
      cost: 0.02,
      verdict: { A: score, B: score, winner: "tie", evidence_sufficient: true },
    };
    writeJSON(path.join(dir, "results/judge-new.json"), judge);
    writeJSON(path.join(dir, "results/judge-old.json"), {
      ...judge,
      baselineCacheKey: "old",
      verdict: { ...judge.verdict, winner: "B" },
    });
    report(dir);
    const s = JSON.parse(fs.readFileSync(path.join(dir, "summary.json")));
    assert.equal(s.answers[0].completed, 1);
    assert.equal(s.answers[0].medianTotalSeconds, 0.1);
    assert.equal(s.comparisons[0].production.n, 1);
    assert.equal(s.comparisons[0].production.wins, 0);
    assert.equal(s.judgeMissing, 1);
    const html = fs.readFileSync(path.join(dir, "report.html"), "utf8");
    assert.ok(!html.includes("<script>bad</script>"));
    assert.ok(html.includes("&lt;script&gt;bad&lt;/script&gt;"));
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});
