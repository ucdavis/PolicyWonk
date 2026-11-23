import fs from "node:fs";
import path from "node:path";
import {
  writeJSON,
  escapeHTML as h,
  variants,
  percentile,
  mean,
  cost,
} from "./core.mjs";
export function report(dir) {
  const dataset = JSON.parse(
    fs.readFileSync(path.join(dir, "dataset.json"), "utf8"),
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(dir, "run-manifest.json"), "utf8"),
  );
  const all = fs
    .readdirSync(path.join(dir, "results"))
    .filter((f) => f.endsWith(".json"))
    .map((f) =>
      JSON.parse(fs.readFileSync(path.join(dir, "results", f), "utf8")),
    );
  const ids = new Set(manifest.expectedCases);
  const answers = all.filter(
    (r) =>
      r.kind === "answer" &&
      manifest.answerKeys.includes(r.cacheKey) &&
      ids.has(r.caseId) &&
      r.repeat === 0,
  );
  const answerKeys = new Set(answers.map((a) => a.cacheKey));
  const paired = all.filter(
    (r) =>
      r.kind === "judge" &&
      r.judgeHash === manifest.judgeHash &&
      ids.has(r.caseId) &&
      answerKeys.has(r.baselineCacheKey) &&
      answerKeys.has(r.candidateCacheKey),
  );
  const judges = paired.filter((r) => !r.reverseCheck);
  const summary = {
    datasetHash: dataset.hash,
    manifest,
    expected: ids.size,
    productionCases: dataset.cases.filter(
      (c) => ids.has(c.id) && c.category === "production",
    ).length,
    syntheticCases: dataset.cases.filter(
      (c) => ids.has(c.id) && c.category === "synthetic",
    ).length,
    answers: [],
    comparisons: [],
    judgeErrors: judges.filter((j) => !j.ok).length,
    judgeMissing: ids.size * (variants.length - 1) - judges.length,
  };
  for (const v of variants) {
    const rows = answers.filter((r) => r.variant.id === v.id);
    const ok = rows.filter((r) => r.ok);
    summary.answers.push({
      variant: v.id,
      completed: ok.length,
      failed: rows.length - ok.length,
      missing: ids.size - rows.length,
      medianFirstTextSeconds: percentile(
        ok.map((r) => r.firstTextMs / 1000),
        0.5,
      ),
      p95TotalSeconds: percentile(
        ok.map((r) => r.totalMs / 1000),
        0.95,
      ),
      medianTotalSeconds: percentile(
        ok.map((r) => r.totalMs / 1000),
        0.5,
      ),
      estimatedCost: ok.reduce((n, r) => n + r.cost, 0),
      meanCostPerAnswer: mean(ok.map((r) => r.cost)),
      normalizedUncachedCost: ok.reduce(
        (n, r) =>
          n +
          cost(v.model, {
            input_tokens: r.usage.input_tokens,
            output_tokens: r.usage.output_tokens,
          }),
        0,
      ),
      meanInputTokens: mean(ok.map((r) => r.usage.input_tokens)),
      meanCachedInputTokens: mean(
        ok.map((r) => r.usage.input_tokens_details?.cached_tokens ?? 0),
      ),
      meanOutputTokens: mean(ok.map((r) => r.usage.output_tokens)),
      meanReasoningTokens: mean(
        ok.map((r) => r.usage.output_tokens_details.reasoning_tokens),
      ),
      invalidCitationAnswers: ok.filter(
        (r) => r.citations.unknown.length || r.citations.unprocessed,
      ).length,
    });
  }
  for (const v of variants.slice(1)) {
    const rows = judges.filter((j) => j.ok && j.candidate === v.id);
    const verdicts = rows.map((j) => ({
      j,
      c: j.verdict[j.A === v.id ? "A" : "B"],
      b: j.verdict[j.A === v.id ? "B" : "A"],
    }));
    const counts = (category, sufficientOnly = false) => {
      const x = verdicts.filter(
        (r) =>
          r.j.category === category &&
          (!sufficientOnly || r.j.verdict.evidence_sufficient),
      );
      return {
        n: x.length,
        wins: x.filter((r) => r.j[r.j.verdict.winner] === v.id).length,
        losses: x.filter(
          (r) =>
            r.j.verdict.winner !== "tie" && r.j[r.j.verdict.winner] !== v.id,
        ).length,
        ties: x.filter((r) => r.j.verdict.winner === "tie").length,
      };
    };
    summary.comparisons.push({
      variant: v.id,
      production: counts("production"),
      synthetic: counts("synthetic"),
      sufficientEvidenceProduction: counts("production", true),
      severeCandidate: verdicts
        .filter((r) => r.c.severe)
        .map((r) => r.j.caseId),
      severeBaseline: verdicts.filter((r) => r.b.severe).map((r) => r.j.caseId),
      insufficientEvidence: verdicts.filter(
        (r) => !r.j.verdict.evidence_sufficient,
      ).length,
      scores: Object.fromEntries(
        [
          "relevance",
          "completeness",
          "grounding",
          "citation_support",
          "uncertainty",
        ].map((k) => [
          k,
          {
            baseline: mean(verdicts.map((r) => r.b[k])),
            candidate: mean(verdicts.map((r) => r.c[k])),
          },
        ]),
      ),
    });
  }
  summary.retrieval = dataset.cases
    .filter((c) => ids.has(c.id))
    .map((c) => {
      const file = path.join(dir, "contexts", c.id + ".json");
      if (!fs.existsSync(file)) return { caseId: c.id, missing: true };
      const ctx = JSON.parse(fs.readFileSync(file, "utf8"));
      return {
        caseId: c.id,
        focus: c.focus,
        sourceCount: ctx.policies.length,
        retrievalMs: ctx.retrievalMs,
      };
    });
  summary.rechecks = paired
    .filter((r) => r.reverseCheck)
    .map((r) => {
      const original = judges.find(
        (j) => j.caseId === r.caseId && j.candidate === r.candidate,
      );
      const winner = (j) =>
        j?.ok
          ? j.verdict.winner === "tie"
            ? "tie"
            : j[j.verdict.winner]
          : "error";
      return {
        caseId: r.caseId,
        candidate: r.candidate,
        originalWinner: winner(original),
        reversedWinner: winner(r),
        agreement: winner(original) === winner(r),
      };
    });
  summary.judgeCost = paired
    .filter((j) => j.ok)
    .reduce((n, r) => n + r.cost, 0);
  summary.ledger = JSON.parse(
    fs.readFileSync(path.join(dir, "ledger.json"), "utf8"),
  );
  summary.knownUsageCost = summary.ledger
    .filter((e) => e.actual !== undefined)
    .reduce((n, e) => n + e.actual, 0);
  summary.unknownCallReservations = summary.ledger
    .filter((e) => e.actual === undefined)
    .reduce((n, e) => n + e.reserved, 0);
  summary.totalEstimatedSpend = summary.ledger.reduce(
    (n, e) => n + (e.actual ?? e.reserved),
    0,
  );
  const reviewFile = path.join(dir, "review-notes.json");
  summary.review = fs.existsSync(reviewFile)
    ? JSON.parse(fs.readFileSync(reviewFile, "utf8"))
    : null;
  writeJSON(path.join(dir, "summary.json"), summary);
  const reviewHTML = summary.review
    ? `<article><h2>Review notes</h2><p>${h(summary.review.reviewer)}. ${h(summary.review.method)}</p><p>${h(summary.review.recommendation ?? "")}</p><p>${summary.review.cases.length} cases checked against frozen evidence.</p>${summary.review.cases.map((r) => `<details><summary>${h(r.caseId)} — ${h(r.assessment)}</summary><p>${h(r.note)}</p></details>`).join("")}</article>`
    : "";
  const fmt = (n) => (n === null ? "—" : Number(n).toFixed(2));
  const metrics = summary.answers
    .map(
      (r) =>
        `<tr><td>${h(r.variant)}</td><td>${r.completed}/${ids.size}</td><td>${r.failed}</td><td>${fmt(r.medianFirstTextSeconds)}s</td><td>${fmt(r.medianTotalSeconds)}s</td><td>${fmt(r.p95TotalSeconds)}s</td><td>$${fmt(r.estimatedCost)}</td><td>${fmt(r.meanReasoningTokens)}</td><td>${r.invalidCitationAnswers}</td></tr>`,
    )
    .join("");
  const comparisons = summary.comparisons
    .map(
      (r) =>
        `<article><h3>${h(r.variant)} vs 5.2 medium</h3><p>Production: ${r.production.wins} wins · ${r.production.ties} ties · ${r.production.losses} losses (${r.production.n} judged). Synthetic: ${r.synthetic.wins} wins · ${r.synthetic.ties} ties · ${r.synthetic.losses} losses.</p><p>Judge-flagged severe: candidate ${r.severeCandidate.length}, baseline ${r.severeBaseline.length}. Insufficient evidence: ${r.insufficientEvidence}.</p><table><tr><th>Criterion (1–5)</th><th>5.2</th><th>Candidate</th></tr>${Object.entries(
          r.scores,
        )
          .map(
            ([k, v]) =>
              `<tr><td>${h(k)}</td><td>${fmt(v.baseline)}</td><td>${fmt(v.candidate)}</td></tr>`,
          )
          .join("")}</table></article>`,
    )
    .join("");
  const cases = dataset.cases
    .filter((c) => ids.has(c.id))
    .map((c) => {
      const sourceFile = path.join(dir, "contexts", c.id + ".json");
      const sources = fs.existsSync(sourceFile)
        ? JSON.parse(fs.readFileSync(sourceFile, "utf8")).policies
        : [];
      const sourceHTML = `<details class="sources"><summary>Frozen evidence (${sources.length} sources)</summary>${sources.map((p) => `<h4>Document ${h(p.docNumber)}: ${h(p.metadata.title)}</h4><p>${h(p.metadata.url)}</p><pre>${h(p.text)}</pre>`).join("")}</details>`;
      const a = answers.filter((r) => r.caseId === c.id);
      const j = judges.filter((r) => r.caseId === c.id);
      const flagged =
        j.some((r) => r.ok && (r.verdict.A.severe || r.verdict.B.severe)) ||
        a.some((r) => !r.ok);
      const loss = j.some(
        (r) =>
          r.ok &&
          r.verdict.winner !== "tie" &&
          r[r.verdict.winner] === "5.2-medium",
      );
      return `<details class="case" data-flag="${flagged ? "severe" : loss ? "loss" : "other"}"><summary>${h(c.id)} · ${h(c.category)} · ${h(c.focus.name)} ${h(c.focus.subFocus ?? "")} ${flagged ? "· REVIEW" : ""} — ${h(c.question)}</summary><p>${h(c.check ?? "")}</p>${sourceHTML}<div class="answers">${variants
        .map((v) => {
          const x = a.find((r) => r.variant.id === v.id);
          return `<article><h3>${h(v.id)}</h3><p>${x?.ok ? `${fmt(x.totalMs / 1000)}s · $${fmt(x.cost)} · ${x.usage.output_tokens} output tokens` : h(x?.error ?? "Not run")}</p><pre>${h(x?.answer ?? "")}</pre></article>`;
        })
        .join(
          "",
        )}</div>${j.map((r) => `<pre class="verdict">${h(r.ok ? JSON.stringify({ candidate: r.candidate, A: r.A, B: r.B, ...r.verdict }, null, 2) : r.error)}</pre>`).join("")}</details>`;
    })
    .join("");
  fs.writeFileSync(
    path.join(dir, "report.html"),
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PolicyWonk model comparison</title><style>body{font:16px system-ui;color:#17263b;background:#f3f6fa;max-width:1500px;margin:32px auto;padding:0 24px}h1{font-size:32px}p{line-height:1.6}table{border-collapse:collapse;width:100%;background:white}td,th{text-align:left;padding:12px;border-bottom:1px solid #dae1ea}article,details{background:white;padding:18px;border-radius:8px;margin:14px 0}summary{cursor:pointer;font-weight:600;line-height:1.5}.answers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.6 system-ui}.verdict{background:#f3f6fa;padding:16px}.controls{position:sticky;top:0;background:#f3f6fa;padding:12px 0}button{padding:9px;margin-right:6px;cursor:pointer}@media(max-width:900px){.answers{grid-template-columns:1fr}table{font-size:13px;display:block;overflow-x:auto}body{padding:12px}}</style><h1>PolicyWonk model comparison</h1><p>${summary.productionCases} recent production questions + ${summary.syntheticCases} synthetic edge cases. Frozen questions and retrieval context; production read-only. Data reviewed for identifiers before model calls.</p><p>Estimated total including judge, embeddings, and conservative charges for unknown failed calls: <b>$${fmt(summary.totalEstimatedSpend)}</b>. Judge cost: $${fmt(summary.judgeCost)}. Known/estimated recorded usage: $${fmt(summary.knownUsageCost)}; unknown interrupted/failed-call reservations: $${fmt(summary.unknownCallReservations)}. Judge failures: ${summary.judgeErrors}; missing comparisons: ${summary.judgeMissing}. Reversed-order checks: ${summary.rechecks.filter((r) => r.agreement).length}/${summary.rechecks.length} winner agreement.</p><p>Generation-only latency on this machine, not website response time. Hidden reasoning is included in output cost. Quality scores are automated evidence-based judgments, not independently verified policy truth. Different wording of the same recent topic can remain after exact normalized deduplication; the sample is not traffic-weighted. Human review is required for severe flags.</p><table><tr><th>Model</th><th>Success</th><th>Errors</th><th>Median first text</th><th>Median total</th><th>p95 total</th><th>Answer cost</th><th>Mean reasoning tokens</th><th>Invalid citations</th></tr>${metrics}</table><p>Observed costs reflect different cache-hit rates. With cached-input discounts removed, the same recorded token usage would cost ${summary.answers.map((r) => `${h(r.variant)}: $${fmt(r.normalizedUncachedCost)}`).join("; ")}. These estimates are generation-only and exclude the judge.</p>${comparisons}${reviewHTML}<h2>Retrieval and review</h2><p>Zero-source cases: ${
      summary.retrieval
        .filter((r) => r.sourceCount === 0)
        .map((r) => h(r.caseId))
        .join(", ") || "none"
    }. Shared source gaps cannot be fixed by changing the answer model.</p><h2>Questions and answers</h2><div class="controls"><button onclick="filter('all')">All</button><button onclick="filter('severe')">Severe / errors</button><button onclick="filter('loss')">Other baseline wins</button><button onclick="document.querySelectorAll('details').forEach(x=>x.open=false)">Collapse</button></div>${cases}<p>Dataset ${h(dataset.hash)} · code ${h(manifest.codeHash)} · prices ${h(manifest.priceDate)} · judge ${h(manifest.judgeModel)}</p><script>function filter(kind){document.querySelectorAll('details.case').forEach(x=>x.hidden=kind!=='all'&&x.dataset.flag!==kind)}</script></html>`,
    { mode: 0o600 },
  );
  console.log(
    `Report: ${path.join(dir, "report.html")} · estimated spend $${summary.totalEstimatedSpend.toFixed(2)}`,
  );
}
