const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const appRequire = createRequire('/app/server.js');
const runtime = appRequire('./.next/server/webpack-runtime.js');
for (const f of fs.readdirSync('/app/.next/server/chunks')) if (f.endsWith('.js')) runtime.C(appRequire('./.next/server/chunks/' + f));
// Register the release's external dependencies without starting the HTTP server.
const page = fs.readFileSync('/app/.next/server/pages/api/oauth/saml.js', 'utf8');
for (const [,id,name] of page.matchAll(/(\d+):e=>\{e.exports=require\("([^"]+)"\)\}/g)) runtime.m[id] = m => { m.exports = appRequire(name); };
const saml = runtime(19560), log = appRequire('./sso-diagnostics/index.cjs');
const fixture = JSON.parse(fs.readFileSync('/fixtures/fixtures.json', 'utf8'));
const records = [];
const stdout = process.stdout.write;
process.stdout.write = function (line, ...rest) {
 try { const obj = JSON.parse(line); if(obj.event === 'saml_validation') {records.push(obj);return true;} } catch {}
 return stdout.call(this, line, ...rest);
};
async function validate(xml, cert, tenant = 'lbl') {
 return log.run({tenant, product:'policywonk',idpMetadata:{publicKey:cert}}, xml, () => saml.validate(xml,{publicKey:cert,privateKey:fixture.key,audience:'https://sp.example.invalid'}));
}
(async () => {
 const certificateSets = [fixture.cert, fixture.cert+','+fixture.other, fixture.other+','+fixture.cert, fixture.cert+','+fixture.cert];
 for (const name of ['plain','encrypted','encrypted256','encryptedBothSigned','encryptedAssertionSigned']) {
  for (const cert of certificateSets) {
   await validate(fixture[name],cert);
   const record=records.at(-1);
   assert.equal(record.outcome,'validated',name);
   if(name==='encrypted'||name==='encrypted256') {
    assert.deepEqual(record.phases,['decrypted','original_fallback']);
    assert.equal(record.attempts.at(-1).outcome,'verified');
   }
  }
 }
 for (const name of ['wrongAudience','expired','tampered','unsigned','duplicateId','badCiphertext']) {
  assert.notEqual(fixture[name],fixture.encrypted, 'negative fixture must differ: '+name);
  for(const cert of certificateSets) await assert.rejects(validate(fixture[name],cert), name);
 }
 for(const name of ['plain','encrypted','encryptedBothSigned']) {
  await assert.rejects(validate(fixture[name],fixture.other));
  await assert.rejects(validate(fixture[name],fixture.other+','+fixture.other));
 }
 await assert.rejects(validate(fixture.plain.replace('PRIVATE_NAME_MARKER','TAMPERED'),fixture.cert));
 await Promise.all([validate(fixture.plain,fixture.cert,'ucdavis'),validate(fixture.plain,fixture.cert,'ucop')]);
 assert.deepEqual(new Set(records.slice(-2).map(r=>r.tenant)),new Set(['ucdavis','ucop']));
 assert.equal(new Set(records.map(r=>r.correlation_id)).size,records.length);
 const serialized=JSON.stringify(records);
 for(const secret of ['PRIVATE_NAME_MARKER','PRIVATE_SESSION_MARKER','TAMPERED','BEGIN','<','https://idp']) assert.ok(!serialized.includes(secret),secret);
 assert.ok(records.every(r=>r.attempts.every(a=>/^[a-f0-9]{64}$/.test(a.certificate_sha256))));
 const before=records.length;
 process.env.SSO_DIAGNOSTICS_ENABLED='false';
 await validate(fixture.plain,fixture.cert);
 await validate(fixture.encrypted,fixture.cert+','+fixture.other);
 await assert.rejects(validate(fixture.tampered,fixture.cert+','+fixture.other));
 assert.equal(records.length,before);
 // A broken log sink must not fail otherwise valid authentication.
 process.env.SSO_DIAGNOSTICS_ENABLED='true';
 process.stdout.write=()=>{throw new Error('sink unavailable');};
 await validate(fixture.plain,fixture.cert);
 process.stdout.write=stdout;
 assert.deepEqual(log.shape('x'.repeat(2*1024*1024+1)),{inspected:false});
 console.log('PASS: actual bundled validation, encrypted single/multi cert, rollover order, tamper rejection, isolation, redaction and disable switch');
 console.log(JSON.stringify(records.find(r=>r.certificate_count===2 && r.encrypted_assertion && r.outcome==='validated')));
})().catch(error=>{process.stdout.write=stdout;console.error(error);process.exitCode=1;});
