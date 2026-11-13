'use strict';
const { AsyncLocalStorage } = require('node:async_hooks');
const { randomUUID, X509Certificate } = require('node:crypto');
const { DOMParser } = require('@xmldom/xmldom');
const contexts = new AsyncLocalStorage();
const DS = 'http://www.w3.org/2000/09/xmldsig#';
const ASSERTION = 'urn:oasis:names:tc:SAML:2.0:assertion';
const PROTOCOL = 'urn:oasis:names:tc:SAML:2.0:protocol';

// Never emit an exception message: XML/signature errors can contain assertions.
function category(error) {
  const message = String(error?.inner?.message || error?.message || '');
  if (/all the certificates/.test(message)) return 'no_certificate_verified';
  if (/digest/i.test(message)) return 'digest_mismatch';
  if (/signature/i.test(message)) return 'signature_invalid';
  if (/decrypt/i.test(message)) return 'decryption_failed';
  if (/expired/i.test(message)) return 'assertion_expired';
  if (/audience/i.test(message)) return 'audience_invalid';
  if (/InResponseTo/i.test(message)) return 'request_mismatch';
  if (/wrapping|multiple|root/i.test(message)) return 'xml_structure_invalid';
  return 'validation_error';
}
function fingerprint(cert) {
  try {
    const pem = cert.includes('BEGIN CERTIFICATE') ? cert :
      `-----BEGIN CERTIFICATE-----\n${cert.match(/.{1,64}/g).join('\n')}\n-----END CERTIFICATE-----`;
    return new X509Certificate(pem).fingerprint256.replaceAll(':', '').toLowerCase();
  } catch { return 'unparseable_certificate'; }
}
function shape(xml) {
  if (typeof xml !== 'string' || Buffer.byteLength(xml) > 2 * 1024 * 1024) return { inspected: false };
  try {
    const doc = new DOMParser({ onError: () => {} }).parseFromString(xml, 'application/xml');
    const signatures = Array.from(doc.getElementsByTagNameNS(DS, 'Signature'));
    const signed = (ns, name) => signatures.some(s => s.parentNode?.namespaceURI === ns && s.parentNode?.localName === name);
    return {
      inspected: true,
      encrypted_assertion: doc.getElementsByTagNameNS(ASSERTION, 'EncryptedAssertion').length > 0,
      response_signature: signed(PROTOCOL, 'Response'),
      visible_assertion_signature: signed(ASSERTION, 'Assertion'),
    };
  } catch { return { inspected: false }; }
}
function emit(record) {
  try { process.stdout.write(JSON.stringify(record) + '\n'); } catch { /* Logging cannot change sign-in. */ }
}
function configuredLabel(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9._-]{1,80}$/.test(value) ? value : 'other';
}
async function run(connection, xml, validate) {
  if (process.env.SSO_DIAGNOSTICS_ENABLED === 'false') return validate();
  const record = {
    event: 'saml_validation', schema_version: 1, correlation_id: randomUUID(),
    tenant: configuredLabel(connection?.tenant), product: configuredLabel(connection?.product),
    ...shape(xml), certificate_count: connection?.idpMetadata?.publicKey?.split(',').length || 0,
    attempts: [], attempt_count: 0, phases: [],
  };
  const start = Date.now();
  return contexts.run({ record }, async () => {
    try {
      const result = await validate();
      record.outcome = 'validated';
      return result;
    } catch (error) {
      record.outcome = 'rejected';
      record.reason = category(error);
      throw error;
    } finally {
      record.timestamp = new Date().toISOString();
      record.duration_ms = Date.now() - start;
      emit(record);
    }
  });
}
function phase(name, validate) {
  const context = contexts.getStore();
  if (context) {
    context.phase = name;
    if (context.record.phases.length < 8) context.record.phases.push(name);
  }
  return validate();
}
function check(verifier, xml, cert) {
  const context = contexts.getStore();
  if (!context) return verifier.checkSignature(xml);
  const algorithms = {
    'http://www.w3.org/2000/09/xmldsig#rsa-sha1': 'rsa-sha1',
    'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256': 'rsa-sha256',
    'http://www.w3.org/2001/04/xmldsig-more#rsa-sha512': 'rsa-sha512',
  };
  const attempt = {
    phase: context.phase || 'unknown', certificate_sha256: fingerprint(cert),
    signature_algorithm: algorithms[verifier.signatureAlgorithm] || 'other',
  };
  context.record.attempt_count++;
  try {
    const valid = verifier.checkSignature(xml);
    attempt.outcome = valid ? 'verified' : 'rejected';
    // xml-crypto returns false for reference/digest failure, and throws for signature failure.
    if (!valid) attempt.reason = 'reference_validation_failed';
    return valid;
  } catch (error) {
    attempt.outcome = 'rejected';
    attempt.reason = category(error);
    throw error;
  } finally {
    if (context.record.attempts.length < 8) context.record.attempts.push(attempt);
  }
}
module.exports = { run, phase, check, shape, category, fingerprint };
