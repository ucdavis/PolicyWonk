# SSO diagnostics

PolicyWonk's shared Boxy service uses stdout/stderr captured by Azure App Service container logs. There is no OTEL exporter configured for SSO. The web application's Elasticsearch chat/feedback records are a separate data path.

The `saml_validation` JSON event reports validation of an incoming response, not completion of the application login. It includes a generated correlation ID, configured tenant/product, observed encryption and signature placement, certificate count, attempted certificate SHA-256 fingerprints, signature algorithm, validation phases, outcome, duration, and bounded failure categories. Signature-placement flags describe the incoming, untrusted XML. An encrypted assertion's inner signature is not visible until decryption; `visible_assertion_signature: false` does not prove it is unsigned.

No raw XML, attributes, NameID, session identifiers, RelayState, tokens, private keys, or arbitrary exception messages are emitted by these diagnostics. Only eight certificate attempts/phases are retained per event. XML inspection is skipped above 2 MiB. Concurrent requests use separate AsyncLocalStorage contexts. Logging write failures do not change validation results. Existing upstream logging is unchanged.

`SSO_DIAGNOSTICS_ENABLED=false` disables the added instrumentation at runtime. Restart the app after changing that setting. Azure's filesystem container logs rotate; download the logs promptly after a scheduled test. This change does not add durable centralized retention or OTEL.

## Build and test

```sh
docker build --platform linux/amd64 -t policywonk-sso:diagnostics deploy/boxy
bash deploy/boxy/tests/run.sh policywonk-sso:diagnostics
```

The tests generate throwaway certificates and synthetic assertions, then exercise the actual validator bundled in the image. They cover plaintext and encrypted assertions, both certificate orders, tamper rejection, concurrent request isolation, log redaction, a failed log sink, and disabling instrumentation. The existing encrypted-response/multiple-certificate failure must remain a failure in this logging-only change.

Jackson 1.42.0 bundles the library into Next.js webpack chunks rather than shipping editable library files. `patch.cjs` verifies the SHA-256 of all four affected chunks before inserting observation-only calls. A different image or upstream rebuild fails the build instead of silently missing an instrumentation point. On upgrade, review the upstream source and bundle, update the instrumentation and hashes, and rerun the image tests. Do not bypass the hash checks.

## Deployment

The frontend pipeline builds and tests this image and pushes it on main, but does not deploy SSO automatically. The `policywonk-prod-sso` Azure app serves both TEST and production, so replacing its image affects both environments. Validate a new image locally with an isolated in-memory database first. Record the existing image and log settings before changing the shared app. Deploy an immutable tag/digest and verify startup, the admin page, and public campus redirects. A password-page redirect is not proof of successful SAML validation; a campus test login is still required.

Rollback by restoring the previous image URI. For troubleshooting, download the App Service logs and search for `"event":"saml_validation"`, then match tenant and UTC timestamp. The correlation ID groups the certificate attempts within one event; it is not sent back to the user's browser.
