// Reproduce the bug with the unmodified, pinned 1.10.0 registry release.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const saml = require('../diagnostics/node_modules/@boxyhq/saml20').default;
const fixture = JSON.parse(fs.readFileSync('/fixtures/fixtures.json', 'utf8'));
const validate = (xml, cert) => saml.validate(xml, {
  publicKey: cert, privateKey: fixture.key, audience: 'https://sp.example.invalid',
});
(async () => {
  await validate(fixture.encrypted, fixture.cert);
  for (const cert of [fixture.cert + ',' + fixture.other, fixture.other + ',' + fixture.cert]) {
    await validate(fixture.plain, cert);
    await assert.rejects(validate(fixture.encrypted, cert), error => {
      assert.equal(error.inner?.message, 'invalid signature: Failed to verify signature against all the certificates provided.');
      return true;
    });
  }
  console.log('PASS: unmodified saml20 1.10.0 reproduces encrypted multi-certificate failure in both certificate orders');
})().catch(error => { console.error(error); process.exitCode = 1; });
