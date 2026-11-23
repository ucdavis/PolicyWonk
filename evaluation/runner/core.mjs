import { createHash } from "node:crypto";
import fs from "node:fs";
export const hash = (value) =>
  createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("hex");
export const readLines = (file) =>
  fs
    .readFileSync(file, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map(JSON.parse);
export const writeJSON = (file, value) => {
  const temp = file + ".tmp";
  fs.writeFileSync(temp, JSON.stringify(value, null, 2), { mode: 0o600 });
  fs.renameSync(temp, file);
};
export const variants = [
  { id: "5.2-medium", model: "gpt-5.2", effort: "medium" },
  { id: "terra-medium", model: "gpt-5.6-terra", effort: "medium" },
  { id: "terra-low", model: "gpt-5.6-terra", effort: "low" },
];
// Standard US endpoint USD per 1M, checked 2026-09-21. Cache-write premium included separately.
export const rates = {
  "gpt-5.2": [1.75, 0.175, 1.75, 14],
  "gpt-5.6-terra": [2.2, 0.22, 2.75, 13.2],
  "gpt-5.6-sol": [4.4, 0.44, 5.5, 22],
};
export function cost(model, usage) {
  const [input, cached, write, output] = rates[model];
  const details = usage.input_tokens_details ?? {};
  const read = details.cached_tokens ?? 0,
    written = details.cache_write_tokens ?? 0;
  return (
    (Math.max(0, (usage.input_tokens ?? 0) - read - written) * input +
      read * cached +
      written * write +
      (usage.output_tokens ?? 0) * output) /
    1e6
  );
}
export function ceiling(model, text, maxOutput) {
  const rate = rates[model];
  // UTF-8 bytes upper-bound ordinary text tokenization; include protocol/prompt overhead.
  return (
    ((Buffer.byteLength(text, "utf8") + 4096) * Math.max(rate[0], rate[2]) * 2 +
      maxOutput * rate[3]) /
    1e6
  );
}
export function assertApproved(rows) {
  if (!rows.length) throw new Error("Empty dataset");
  const seen = new Set();
  for (const row of rows) {
    if (
      !row.question ||
      row.privacy?.status !== "approved" ||
      !row.privacy.reviewedBy ||
      row.privacy.questionHash !== hash(row.question)
    )
      throw new Error(`Unreviewed or modified question: ${row.id}`);
    if (seen.has(row.id)) throw new Error("Duplicate case ID");
    seen.add(row.id);
  }
}
export function citationCheck(text, policies) {
  const body = text.split("## Citations")[0];
  const cited = [
    ...new Set([...body.matchAll(/\[\^(\d+)\]/g)].map((m) => Number(m[1]))),
  ];
  const available = new Set(policies.map((p) => p.docNumber));
  return {
    count: cited.length,
    unknown: cited.filter((x) => !available.has(x)),
    unprocessed: /<c:\d*>/.test(text),
  };
}
export const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function percentile(values, p) {
  const s = values.filter(Number.isFinite).sort((a, b) => a - b);
  return s.length
    ? s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)]
    : null;
}
export const mean = (v) =>
  v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
export class Budget {
  constructor(file, cap) {
    this.file = file;
    this.cap = cap;
    this.entries = fs.existsSync(file)
      ? JSON.parse(fs.readFileSync(file, "utf8"))
      : [];
  }
  total() {
    return this.entries.reduce((n, e) => n + (e.actual ?? e.reserved), 0);
  }
  reserve(id, amount) {
    if (this.total() + amount > this.cap)
      throw new Error(`Budget cap $${this.cap} reached`);
    const e = { id, reserved: amount, at: new Date().toISOString() };
    this.entries.push(e);
    this.save();
    return e;
  }
  settle(entry, actual) {
    entry.actual = actual;
    this.save();
  }
  save() {
    writeJSON(this.file, this.entries);
  }
}
