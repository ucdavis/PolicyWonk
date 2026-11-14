// Verify emitted diagnostics from the final image's real HTTP request path.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const lines = fs.readFileSync(process.argv[2], 'utf8').split('\n');
const events = lines.flatMap(line => {
  try { const event = JSON.parse(line); return event.event === 'saml_validation' ? [event] : []; }
  catch { return []; }
});
assert.equal(events.length, 12, 'One diagnostic per synthetic ACS request');
assert.equal(new Set(events.map(e => e.correlation_id)).size, events.length);
for (const tenant of ['single', 'first', 'second', 'duplicate']) {
  const records = events.filter(e => e.tenant === tenant);
  assert.equal(records.length, 3);
  assert.equal(records.filter(e => e.outcome === 'validated').length, 1);
  assert.equal(records.filter(e => e.outcome === 'rejected').length, 2);
  const valid = records.find(e => e.outcome === 'validated');
  assert.deepEqual(valid.phases, ['decrypted', 'original_fallback']);
  assert.equal(valid.certificate_count, tenant === 'single' ? 1 : 2);
  assert.equal(valid.attempts.at(-1).outcome, 'verified');
  assert.ok(valid.attempts.every(a => /^[a-f0-9]{64}$/.test(a.certificate_sha256)));
}
const serialized = JSON.stringify(events);
for (const sensitive of ['test@example.invalid', '<', 'BEGIN', 'isolated-test-key', 'SAMLResponse', 'RelayState']) {
  assert.ok(!serialized.includes(sensitive), 'Diagnostic redaction: ' + sensitive);
}
console.log('PASS: HTTP diagnostics contain isolated request contexts, fallback attempts and certificate fingerprints without identity or protocol payloads');
