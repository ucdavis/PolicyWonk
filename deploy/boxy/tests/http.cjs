// Full HTTP SSO exercise against a disposable, local, in-memory Boxy instance.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { inflateRawSync } = require('node:zlib');
const { promisify } = require('node:util');
const { DOMParser } = require('../diagnostics/node_modules/@xmldom/xmldom');
const saml = require('../diagnostics/node_modules/@boxyhq/saml20').default;
const xmlenc = require('../diagnostics/node_modules/xml-encryption');
const [base, fixturePath] = process.argv.slice(2);
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const issuer = 'https://idp.example.invalid';
const audience = 'https://sp.example.invalid';
const callback = audience + '/callback';
const ns = 'urn:oasis:names:tc:SAML:2.0:assertion';
const pemBody = cert => cert.replace(/-----(BEGIN|END) CERTIFICATE-----|\s/g,'');
const parse = xml => new DOMParser({onError:()=>{}}).parseFromString(xml,'application/xml');
async function fetchLocal(path, options={}) {
 const url=new URL(path,base);
 assert.equal(url.origin,new URL(base).origin, 'Tests must not send requests outside the isolated instance');
 return fetch(url,{...options,redirect:'manual',signal:AbortSignal.timeout(15000)});
}
(async()=>{
 let ready=false;
 for(let i=0;i<30;i++) {
  try { if((await fetchLocal('/')).status===200){ready=true;break;} } catch {}
  await new Promise(resolve=>setTimeout(resolve,1000));
 }
 assert.ok(ready,'Isolated Boxy startup');
 const spCert=await (await fetchLocal('/.well-known/saml.cer')).text();
 for(const [tenant,certs] of [['single',[fixture.cert]],['first',[fixture.cert,fixture.other]],['second',[fixture.other,fixture.cert]]]) {
  const descriptors=certs.map(cert=>`<KeyDescriptor use="signing"><KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><X509Data><X509Certificate>${pemBody(cert)}</X509Certificate></X509Data></KeyInfo></KeyDescriptor>`).join('');
  const metadata=`<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${issuer}/${tenant}"><IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">${descriptors}<SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${issuer}/sso"/></IDPSSODescriptor></EntityDescriptor>`;
  const create=await fetchLocal('/api/v1/sso',{method:'POST',headers:{Authorization:'Api-Key isolated-test-key','Content-Type':'application/json'},body:JSON.stringify({tenant,product:'isolated-test',rawMetadata:metadata,redirectUrl:callback,defaultRedirectUrl:callback})});
  assert.equal(create.status,200,'Create isolated IdP');
  const connection=await create.json();
  for(const mode of ['valid','tamper','request-mismatch']) {
   const state=randomUUID();
   const auth=await fetchLocal('/api/oauth/authorize?'+new URLSearchParams({client_id:connection.clientID,redirect_uri:callback,response_type:'code',state}));
   assert.equal(auth.status,302);
   const redirect=new URL(auth.headers.get('location'));
   const request=parse(inflateRawSync(Buffer.from(redirect.searchParams.get('SAMLRequest'),'base64')).toString()).documentElement;
   const requestId=mode==='request-mismatch'?'_wrong_request':request.getAttribute('ID'), acs=request.getAttribute('AssertionConsumerServiceURL');
   const now=new Date().toISOString(), expiry=new Date(Date.now()+600000).toISOString();
   const assertion=`<a:Assertion xmlns:a="${ns}" ID="_${randomUUID()}" Version="2.0" IssueInstant="${now}"><a:Issuer>${issuer}/${tenant}</a:Issuer><a:Subject><a:NameID>test@example.invalid</a:NameID><a:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><a:SubjectConfirmationData InResponseTo="${requestId}" Recipient="${acs}" NotOnOrAfter="${expiry}"/></a:SubjectConfirmation></a:Subject><a:Conditions NotBefore="${new Date(Date.now()-60000).toISOString()}" NotOnOrAfter="${expiry}"><a:AudienceRestriction><a:Audience>${audience}</a:Audience></a:AudienceRestriction></a:Conditions><a:AuthnStatement AuthnInstant="${now}" SessionIndex="_${randomUUID()}"/><a:AttributeStatement><a:Attribute Name="email"><a:AttributeValue>test@example.invalid</a:AttributeValue></a:Attribute></a:AttributeStatement></a:Assertion>`;
   const encrypted=await promisify(xmlenc.encrypt)(assertion,{rsa_pub:spCert,pem:spCert,encryptionAlgorithm:'http://www.w3.org/2001/04/xmlenc#aes128-cbc',keyEncryptionAlgorithm:'http://www.w3.org/2001/04/xmlenc#rsa-oaep-mgf1p',keyEncryptionDigest:'sha1'});
   const xml=`<p:Response xmlns:p="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:a="${ns}" ID="_${randomUUID()}" Version="2.0" IssueInstant="${now}" InResponseTo="${requestId}" Destination="${acs}"><a:Issuer>${issuer}/${tenant}</a:Issuer><p:Status><p:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></p:Status><a:EncryptedAssertion>${encrypted}</a:EncryptedAssertion></p:Response>`;
   let signed=saml.sign(xml,fixture.key,fixture.cert,'/*[local-name(.)="Response"]');
   if(mode==='tamper') signed=signed.replace(`Destination="${acs}"`,'Destination="https://wrong.example.invalid/acs"');
   const result=await fetchLocal('/api/oauth/saml',{method:'POST',body:new URLSearchParams({SAMLResponse:Buffer.from(signed).toString('base64'),RelayState:redirect.searchParams.get('RelayState')})});
   assert.equal(result.status,302);
   const destination=new URL(result.headers.get('location'),base);
   assert.equal(destination.origin+destination.pathname,callback);
   assert.equal(destination.searchParams.get('state'),state);
   if(mode!=='valid') {
    assert.equal(destination.searchParams.get('error'),'access_denied');
    assert.equal(destination.searchParams.has('code'),false);
   } else {
    assert.equal(destination.searchParams.has('error'),false);
    assert.ok(destination.searchParams.get('code'));
    const token=await fetchLocal('/api/oauth/token',{method:'POST',body:new URLSearchParams({grant_type:'authorization_code',code:destination.searchParams.get('code'),client_id:connection.clientID,client_secret:connection.clientSecret,redirect_uri:callback})});
    assert.equal(token.status,200,'Token exchange');
    const tokens=await token.json();
    assert.ok(tokens.access_token);
    const profile=await fetchLocal('/api/oauth/userinfo',{headers:{Authorization:'Bearer '+tokens.access_token}});
    assert.equal(profile.status,200,'Userinfo');
    assert.equal((await profile.json()).email,'test@example.invalid');
   }
  }
 }
 console.log('PASS: isolated HTTP authorize, encrypted ACS, token exchange and userinfo for single/two certs in both orders; tampered and request-mismatched responses denied');
})().catch(error=>{console.error(error);process.exitCode=1;});
