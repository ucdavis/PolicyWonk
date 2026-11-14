# SSO source build and diagnostics

PolicyWonk's shared Boxy service uses stdout/stderr captured by Azure App Service container logs. There is no OTEL exporter configured for SSO. The web application's Elasticsearch chat/feedback records are a separate data path.

The `saml_validation` JSON event reports validation of an incoming response, not completion of the application login. It includes a generated correlation ID, configured tenant/product, observed encryption and signature placement, certificate count, attempted certificate SHA-256 fingerprints, signature algorithm, validation phases, outcome, duration, and bounded failure categories. Signature-placement flags describe the incoming, untrusted XML. An encrypted assertion's inner signature is not visible until decryption; `visible_assertion_signature: false` does not prove it is unsigned.

No raw XML, attributes, NameID, session identifiers, RelayState, tokens, private keys, or arbitrary exception messages are emitted by these diagnostics. Only eight certificate attempts/phases are retained per event. XML inspection is skipped above 2 MiB. Concurrent requests use separate AsyncLocalStorage contexts. Logging write failures do not change validation results. Existing upstream logging is unchanged.

`SSO_DIAGNOSTICS_ENABLED=false` disables the added instrumentation at runtime. Restart the app after changing that setting. Azure's filesystem container logs rotate; download the logs promptly after a scheduled test. This change does not add durable centralized retention or OTEL.

## Build and test

```sh
docker build --platform linux/amd64 -t policywonk-sso:source deploy/boxy
bash deploy/boxy/tests/run.sh policywonk-sso:source
```

The Docker build downloads SHA-256-verified source archives for Jackson 1.42.0
(`ory/polis` commit `0d2d849aa99b0a36ddd2f06fa11bd6307842d6e6`) and
`@boxyhq/saml20` 1.10.0 (`ory/saml20` commit `fee694e7e88fed7f440c8787ff87fd5586aa7bdf`).
It applies the readable patches under `patches/` before TypeScript and Next.js
compilation. The Next.js alias selects the compiled patched SAML library. There
are no edits to generated JavaScript or dependencies on webpack chunk names.

The SAML fix preserves an explicit signature-reference mismatch when trying
multiple trusted certificates. This lets the existing response validator retry
the original encrypted response, whose signature covers the ciphertext rather
than the decrypted assertion. Exceptions still fail validation, and the retry
must verify a trusted signature. Certificate rollover, encryption, audience,
expiration, and request correlation checks remain enabled.

The build runs the compiled-library regression matrix using disposable keys.
It covers plaintext, AES-128/256 encrypted assertions, outer/inner signatures,
both certificate orders, untrusted certificates, tampering, expiration, audience,
duplicate IDs, broken ciphertext, logging isolation/redaction, a failed log sink,
and disabling diagnostics. The separate HTTP test runs the final image with an
in-memory database and synthetic IdPs, then exercises authorize, encrypted ACS,
token exchange, and userinfo. No production credentials or real assertions are
used. These tests do not substitute for a successful campus login.

Archive checksum mismatches and patch conflicts stop the build. On an upstream
upgrade, review source changes, update pins/checksums and patches, and rerun both
test layers. A patch that still applies is not proof of behavioral compatibility.
Dependency installs use upstream lockfiles. This approach requires maintaining
the source build and its dependencies, and takes longer than patching an upstream
image. The runtime retains the patched Node 22.23.4 release used in production.

## Deployment

The frontend pipeline builds and tests this image and pushes it on main, but does not deploy SSO automatically. The `policywonk-prod-sso` Azure app serves both TEST and production, so replacing its image affects both environments. Validate a new image locally with an isolated in-memory database first. Record the existing image and log settings before changing the shared app. Deploy an immutable tag/digest and verify startup, the admin page, and public campus redirects. A password-page redirect is not proof of successful SAML validation; a campus test login is still required.

Rollback by restoring the previous image URI. For troubleshooting, download the App Service logs and search for `"event":"saml_validation"`, then match tenant and UTC timestamp. The correlation ID groups the certificate attempts within one event; it is not sent back to the user's browser.
