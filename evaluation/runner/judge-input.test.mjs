import { test } from "node:test";
import assert from "node:assert/strict";
import { buildJudgeEvidence } from "./judge-input.mjs";
test("judge sees merged source labels and matching app-generated citation URLs", () => {
  const evidence = buildJudgeEvidence({
    system:
      "Instructions\n<documents>\nDocument: 0\ntext: first chunk\n\nsecond chunk\n</documents>\nOther instructions",
    policies: [
      {
        docNumber: 0,
        text: "first chunk",
        metadata: {
          hash: "same",
          title: "Policy",
          url: "https://example.invalid/policy",
        },
      },
      {
        docNumber: 4,
        text: "second chunk",
        metadata: {
          hash: "same",
          title: "Policy",
          url: "https://example.invalid/policy",
        },
      },
    ],
  });
  assert.equal(
    evidence.documents,
    "Document: 0\ntext: first chunk\n\nsecond chunk",
  );
  assert.deepEqual(evidence.citationCatalog, [
    { number: 0, title: "Policy", url: "https://example.invalid/policy" },
  ]);
});
test("no retrieved documents yields no invented evidence", () =>
  assert.deepEqual(
    buildJudgeEvidence({
      system: "Reply with insufficient information",
      policies: [],
    }),
    { documents: "", citationCatalog: [] },
  ));
