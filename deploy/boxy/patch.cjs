'use strict';
// The release image bundles SAML into webpack chunks. Only instrument the exact
// audited bytes. Upgrading Jackson requires reviewing and renewing these hashes.
const { readFileSync, writeFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const path = require('node:path');
const root = process.argv[2] || '/app/.next/server/chunks';
const helper = 'require("/app/sso-diagnostics/index.cjs")';
const files = {
  '1891': '670787d9336b7272a57c6609fc5c9706d1417f80683928d93886e011bb1624e1',
  '3130': 'f9a6693efc78da7e8411592a91af2a7d2d59642ef72a993807e1a640ff0a3559',
  '5905': 'a338906fdb85cff53e92c3ba8d52ed6ce7afbbe2df2b91d21f49d134e0240785',
  '5036': '1879bb2142bcdae94cb12671db1850531de70c02c3edc08696b039361cba8e5b',
};
for (const [id, expected] of Object.entries(files)) {
  const file = path.join(root, id + '.js');
  let source = readFileSync(file, 'utf8');
  if (createHash('sha256').update(source).digest('hex') !== expected) throw Error(`Unaudited Jackson bundle: ${id}`);
  function replace(before, after) {
    if (source.split(before).length !== 2) throw Error(`Unexpected instrumentation site: ${id}: ${before}`);
    source = source.replace(before, after);
  }
  if (id === '1891' || id === '3130') {
    replace('try{f=D.checkSignature(e)}catch(e){}', `try{f=${helper}.check(D,e,r)}catch(e){}`);
    replace('f=D.checkSignature(e);if(f)', `f=${helper}.check(D,e,t);if(f)`);
    replace('(0,u.validateSignature)(e,t.publicKey,t.thumbprint)', `${helper}.phase(i?"decrypted":"original",()=>(0,u.validateSignature)(e,t.publicKey,t.thumbprint))`);
    replace('(0,u.validateSignature)(n,t.publicKey,t.thumbprint)', `${helper}.phase("original_fallback",()=>(0,u.validateSignature)(n,t.publicKey,t.thumbprint))`);
  } else {
    const options = id === '5905' ? 'g' : 'w';
    replace(`_=await b(r,${options}),h`, `_=await ${helper}.run(t,r,()=>b(r,${options})),h`);
  }
  writeFileSync(file, source);
}
console.log('Instrumented all four pinned Jackson bundles; validation behavior unchanged.');
