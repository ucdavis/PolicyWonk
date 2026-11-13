# SSO validation and diagnostics

PolicyWonk's shared Boxy service uses stdout/stderr captured by Azure App Service container logs. There is no OTEL exporter configured for SSO. The web application's Elasticsearch chat/feedback records are a separate data path.

The `saml_validation` JSON event reports validation of an incoming response, not completion of the application login. It includes a generated correlation ID, configured tenant/product, observed encryption and signature placement, certificate count, attempted certificate SHA-256 fingerprints, signature algorithm, validation phases, outcome, duration, and bounded failure categories. Signature-placement flags describe the incoming, untrusted XML. An encrypted assertion's inner signature is not visible until decryption; `visible_assertion_signature: false` does not prove it is unsigned.

No raw XML, attributes, NameID, session identifiers, RelayState, tokens, private keys, or arbitrary exception messages are emitted by these diagnostics. Only eight certificate attempts/phases are retained per event. XML inspection is skipped above 2 MiB. Concurrent requests use separate AsyncLocalStorage contexts. Logging write failures do not change validation results. Existing upstream logging is unchanged.

`SSO_DIAGNOSTICS_ENABLED=false` disables the added instrumentation at runtime. Restart the app after changing that setting. Azure's filesystem container logs rotate; download the logs promptly after a scheduled test. This change does not add durable centralized retention or OTEL.

## Build and test

```sh
docker build --platform linux/amd64 -t policywonk-sso:diagnostics deploy/boxy
bash deploy/boxy/tests/run.sh policywonk-sso:diagnostics
```

The tests generate throwaway certificates and synthetic assertions, then exercise the actual validator bundled in the image. They cover plaintext and encrypted assertions, both certificate orders, tamper rejection, concurrent request isolation, log redaction, a failed log sink, and disabling instrumentation. Regression cases cover AES-128-CBC/RSA-OAEP as used by LBL, AES-256-CBC, response-only and assertion signatures, duplicate certificates, invalid audiences, expired assertions, unsigned responses, duplicate IDs, and damaged ciphertext. The regression fails against the diagnostics-only image and passes with the fallback patch. A disposable Boxy instance with an in-memory database then exercises authorization, the encrypted SAML callback, token exchange and userinfo, including rejected tampered responses. It uses throwaway IdP certificates and the isolated instance's own SP certificate; it never connects to a real IdP or production database.

Jackson 1.42.0 bundles the library into Next.js webpack chunks rather than shipping editable library files. `patch.cjs` verifies the SHA-256 of all four affected chunks before applying the fallback correction and diagnostic calls. A different image or upstream rebuild fails the build instead of silently missing an instrumentation point. On upgrade, review the upstream source and bundle, update the instrumentation and hashes, and rerun the image tests. Do not bypass the hash checks.

## Deployment

The frontend pipeline builds and tests this image and pushes it on main, but does not deploy SSO automatically. The `policywonk-prod-sso` Azure app serves both TEST and production, so replacing its image affects both environments. Validate a new image locally with an isolated in-memory database first. Record the existing image and log settings before changing the shared app. Deploy an immutable tag/digest and verify startup, the admin page, and public campus redirects. A password-page redirect is not proof of successful SAML validation; a campus test login is still required.

Rollback by restoring the previous image URI. For troubleshooting, download the App Service logs and search for `"event":"saml_validation"`, then match tenant and UTC timestamp. The correlation ID groups the certificate attempts within one event; it is not sent back to the user's browser.

## Encrypted-response fallback correction

The pinned `@boxyhq/saml20` 1.10.0 validator decrypts an assertion before checking its signature. When only the outer Response is signed, changing the encrypted contents to plaintext invalidates that document's digest. The existing fallback correctly retries the original encrypted Response, but it is reached only when the first check returns a false result. The multiple-certificate branch converted that false result into an exception and skipped the fallback.

The patch preserves an explicit `false` result from `checkSignature`, matching the single-certificate behavior. If every certificate check throws, the existing exception is preserved. The fallback still verifies the original Response with configured trusted certificates, and the existing assertion ID, audience, expiration, and request correlation checks still run. It neither trusts embedded keys nor accepts an unchecked response. The logging disable switch does not disable this correction.

This fix belongs upstream in [ory/saml20](https://github.com/ory/saml20), in `lib/validateSignature.ts`, with encrypted-response regression tests. The same throw-on-false branch remains in upstream commit `bf73ed878d00f76052b6001aaf1e58f9b4a54dfc`, inspected on 2026-11-13. A source-level equivalent is to change `if (!valid)` after the multi-cert loop to `if (!valid && valid !== false)`. Once the library fix is released, Jackson/Polis needs the dependency update. The PolicyWonk workaround can be removed after an official image passes these tests. No upstream PR has been submitted as part of this change.
