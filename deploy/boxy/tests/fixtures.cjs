// Generate synthetic data and throwaway keys. No production credentials or assertions.
const { execFileSync } = require('node:child_process');
const { readFileSync, writeFileSync } = require('node:fs');
const { promisify } = require('node:util');
const saml = require('../diagnostics/node_modules/@boxyhq/saml20').default;
const enc = require('../diagnostics/node_modules/xml-encryption');
const dir = process.argv[2];
for (const name of ['trusted', 'rollover']) execFileSync('openssl', ['req','-x509','-newkey','rsa:2048','-nodes','-keyout',`${dir}/${name}.key`,'-out',`${dir}/${name}.crt`,'-days','1','-subj',`/CN=${name}.example.invalid`], { stdio: 'ignore' });
const cert = readFileSync(`${dir}/trusted.crt`, 'utf8'), key = readFileSync(`${dir}/trusted.key`, 'utf8'), other = readFileSync(`${dir}/rollover.crt`, 'utf8');
const ns = 'urn:oasis:names:tc:SAML:2.0:assertion';
const assertion = `<a:Assertion xmlns:a="${ns}" ID="_a" Version="2.0"><a:Issuer>https://idp.example.invalid</a:Issuer><a:Subject><a:NameID>PRIVATE_NAME_MARKER</a:NameID></a:Subject><a:Conditions NotBefore="${new Date(Date.now()-60000).toISOString()}" NotOnOrAfter="${new Date(Date.now()+3600000).toISOString()}"><a:AudienceRestriction><a:Audience>https://sp.example.invalid</a:Audience></a:AudienceRestriction></a:Conditions><a:AuthnStatement AuthnInstant="${new Date().toISOString()}" SessionIndex="PRIVATE_SESSION_MARKER"/></a:Assertion>`;
const response = inner => `<p:Response xmlns:p="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:a="${ns}" ID="_r" Version="2.0"><a:Issuer>https://idp.example.invalid</a:Issuer><p:Status><p:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></p:Status>${inner}</p:Response>`;
(async () => {
 const ciphertext = await promisify(enc.encrypt)(assertion, {rsa_pub:cert,pem:cert,encryptionAlgorithm:'http://www.w3.org/2001/04/xmlenc#aes256-cbc',keyEncryptionAlgorithm:'http://www.w3.org/2001/04/xmlenc#rsa-oaep-mgf1p'});
 const sign = inner => saml.sign(response(inner),key,cert,'/*[local-name(.)="Response"]');
 writeFileSync(`${dir}/fixtures.json`, JSON.stringify({cert,key,other,plain:sign(assertion),encrypted:sign(`<a:EncryptedAssertion>${ciphertext}</a:EncryptedAssertion>`)}));
})();
