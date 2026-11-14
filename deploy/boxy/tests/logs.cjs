// Check only this synthetic run, even when Azure logs include older requests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const report = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const events = fs.readFileSync(process.argv[2], 'utf8').split('\n').flatMap(line => {
  try {
    const event = JSON.parse(line.slice(line.indexOf('{')));
    return event.event === 'saml_validation' && event.product === report.product ? [event] : [];
  } catch { return []; }
});
assert.equal(events.length, report.cases.length, 'One diagnostic per synthetic ACS request');
assert.equal(new Set(events.map(e => e.correlation_id)).size, events.length);
for (const [i, test] of report.cases.entries()) {
  const record = events[i];
  assert.equal(record.tenant, test.tenant);
  assert.equal(record.certificate_count, test.certificateCount);
  assert.equal(record.outcome, test.shouldPass ? 'validated' : 'rejected', test.tenant + '/' + test.mode);
  assert.ok(record.attempts.every(a => /^[a-f0-9]{64}$/.test(a.certificate_sha256)));
  if (test.mode === 'valid') {
    assert.deepEqual(record.phases, test.shouldPass ? ['decrypted', 'original_fallback'] : ['decrypted']);
    if (test.shouldPass) assert.equal(record.attempts.at(-1).outcome, 'verified');
    else assert.equal(record.reason, 'no_certificate_verified');
  }
  if (test.mode === 'plain') assert.deepEqual(record.phases, ['original']);
}
const serialized = JSON.stringify(events);
for (const sensitive of ['test@example.invalid', '<', 'BEGIN', 'isolated-test-key', 'SAMLResponse', 'RelayState', process.env.SSO_TEST_API_KEY].filter(Boolean)) {
  assert.ok(!serialized.includes(sensitive), 'Diagnostics contain sensitive synthetic data');
}
console.log(`PASS: ${report.expected} HTTP diagnostics, ${events.length} isolated request contexts, expected fallback phases and redaction`);
