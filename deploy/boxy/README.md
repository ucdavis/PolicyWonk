# SSO source build and diagnostics

PolicyWonk's shared Boxy service uses stdout/stderr captured by Azure App Service container logs. There is no OTEL exporter configured for SSO. The web application's Elasticsearch chat/feedback records are a separate data path.

The `saml_validation` JSON event reports validation of an incoming response, not completion of the application login. It includes a generated correlation ID, configured tenant/product, observed encryption and signature placement, certificate count, attempted certificate SHA-256 fingerprints, signature algorithm, validation phases, outcome, duration, and bounded failure categories. Signature-placement flags describe the incoming, untrusted XML. An encrypted assertion's inner signature is not visible until decryption; `visible_assertion_signature: false` does not prove it is unsigned.

No raw XML, attributes, NameID, session identifiers, RelayState, tokens, private keys, or arbitrary exception messages are emitted by these diagnostics. Only eight certificate attempts/phases are retained per event. XML inspection is skipped above 2 MiB. Concurrent requests use separate AsyncLocalStorage contexts. Logging write failures do not change validation results. Existing upstream logging is unchanged.

`SSO_DIAGNOSTICS_ENABLED=false` disables the Boxy SAML instrumentation at runtime. Restart the app after changing that setting. Azure's filesystem container logs rotate; download the logs promptly after a scheduled test. This change does not add durable centralized retention or OTEL.

## PolicyWonk application sign-in diagnostics

The web application emits one `policywonk_signin` JSON event when its Boxy SAML
sign-in JWT callback completes or fails. It records an opaque local correlation
ID, timestamp, duration, the configured campus matched from Jackson's requested
tenant, and the resolved application group. Unknown campus/group labels become
`unknown`. Claim-presence flags report ePPN, email, and affiliation presence,
not their values or validity. A `null` flag means claim processing did not reach
that check. `resolved_group: null` means group resolution was not completed.

Stages distinguish claim processing, user upsert, group assignment, and JWT
callback completion. `outcome: completed` means this application callback
returned successfully; it does not prove that Auth.js issued the session cookie
or that the browser received it. The correlation ID is local to this callback
and is not propagated from Boxy's SAML event. Match the two services by campus
and time when diagnosing a campus retry.

Auth.js errors outside that callback emit a separate `auth_error` with an
allowlisted error category. These events do not have a trusted campus or a
callback duration. When Auth.js wraps an already-recorded callback Error, its
second error event is suppressed by object identity. Auth.js warnings are
bounded `auth_warning` events, and raw framework debug output is disabled.
None of these events serialize profiles, claims, identity values, tokens,
cookies, exception messages, causes, or stacks. A failed log sink cannot change
the original authentication result. Development bypass and routine JWT refresh
calls do not emit `policywonk_signin` events.

These web events go to stdout. Enable App Service container logging on each
PolicyWonk web app to collect them; Boxy's log settings cover only Boxy. These
events do not add OTEL or centralized retention. Focused callback and HTTP-flow
regressions run with `npm test` in `web/`, using synthetic identities and local
OAuth endpoints instead of campus credentials.

Application diagnostics have only been tested locally and in CI; they have not
been deployed. The completed isolated Azure broker exercise validates Boxy's
SAML diagnostics, not these application events.

## Build and test

```sh
docker build --platform linux/amd64 -t policywonk-sso:source deploy/boxy
bash deploy/boxy/tests/run.sh policywonk-sso:source
```

The Docker build downloads SHA-256-verified source archives for Jackson 1.42.0
and `@boxyhq/saml20` 1.10.0. [Dockerfile](Dockerfile) owns the immutable source
commits, archive checksums, and runtime image digest.
It applies the readable patches under `patches/` before TypeScript and Next.js
compilation. The Next.js alias selects the compiled patched SAML library. There
are no edits to generated JavaScript or dependencies on webpack chunk names.

The SAML fix preserves an explicit signature-reference mismatch when trying
multiple trusted certificates. This lets the existing response validator retry
the original encrypted response, whose signature covers the ciphertext rather
than the decrypted assertion. If every certificate attempt throws, validation
still fails; the retry must verify a trusted signature. Certificate rollover, encryption, audience,
expiration, and request correlation checks remain enabled.

The build first checks that unmodified saml20 1.10.0 reproduces the encrypted
multi-certificate failure in both certificate orders, then runs the patched
compiled-library regression matrix using disposable keys.
It covers plaintext, AES-128/256 encrypted assertions, outer/inner signatures,
both certificate orders, untrusted certificates, tampering, expiration, audience,
duplicate IDs, broken ciphertext, logging isolation/redaction, a failed log sink,
and disabling diagnostics. The separate HTTP test runs the final image with an
in-memory database and synthetic IdPs, then exercises authorize, plaintext and
encrypted ACS, token exchange, and userinfo with one
signing certificate, both rollover orders, and duplicate certificates. It also
checks rejection of tampered, request-mismatched, wrong-audience, expired, and
untrusted responses and the emitted HTTP diagnostics. No production credentials or real assertions are
used. These tests do not substitute for a successful campus login.

Archive checksum mismatches and patch conflicts stop the build. On an upstream
upgrade, review source changes, update pins/checksums and patches, and rerun both
test layers. A patch that still applies is not proof of behavioral compatibility.
Application and SAML dependency installs use upstream lockfiles. The manual
migration command uses the dedicated [migration-tool lockfile](migrations/package-lock.json).
Native dependencies are rebuilt on the pinned Node image, and the application
starts with `node server.js`. This approach requires maintaining
the source build and its dependencies, and takes longer than patching an upstream
image. The runtime uses the [Node 22.23.5 security release](https://nodejs.org/en/blog/release/v22.23.5).
Jackson and its SAML dependency remain at their deployed versions.

## Isolated Azure test

Both PolicyWonk applications continue using `https://policywonk-sso.ucdavis.edu`.
The separate Azure TEST app, `policywonk-sso` in `policywonk-dev`, can run the
same synthetic HTTP tests without registering another campus endpoint. Its
public URL is `https://policywonk-sso.azurewebsites.net`.

The in-memory matrix requires exactly one TEST broker instance because the client
does not retain App Service affinity cookies. Verify the instance count before
running the matrix.

Back up that TEST app's settings before changing it. Use `DB_ENGINE=mem`, remove
its database connection settings, and configure disposable SAML/OIDC keys and
strong, random API and admin credentials. Set
`SAML_AUDIENCE=https://sp.example.invalid` and `EXTERNAL_URL` to the TEST URL.
Never copy production keys, connections, or database settings.
Enable App Service container logging and set `SSO_DIAGNOSTICS_ENABLED=true`.
Give this TEST app's managed identity `AcrPull` on the existing registry and
configure image pulls to use that identity. Publish test-only images and deploy
each by immutable digest.
Neither PolicyWonk application's `SSO_ISSUER_URL` changes.

For the diagnostics-only baseline, copy the `deploy/boxy` build context into a
separate scratch directory inside the worktree. In that copy's Dockerfile, omit both the check and
application of `saml-encrypted-response.patch`, and omit the invocation of
`node tests/image.cjs`, which requires the fix. Keep `tests/baseline.cjs`, both
diagnostics patches, source verification, and all other build steps. Build that
context with a distinct baseline tag. Build the candidate from the unchanged
`deploy/boxy` context using the command above, including its full regression
matrix. Record both image digests and deploy the baseline first.

The HTTP client creates synthetic connections through the Boxy API and handles
the OAuth callback itself. It never follows the fake IdP or callback URLs. The
hosted target is restricted to this exact TEST hostname and requires explicit
opt-in. To run it after securely exporting the disposable `SSO_TEST_API_KEY`:

```sh
npm ci --prefix deploy/boxy/diagnostics --ignore-scripts --no-audit --no-fund
fixtures_dir=$(mktemp -d)
node deploy/boxy/tests/fixtures.cjs "$fixtures_dir"
SSO_TEST_ALLOW_HOSTED=true SSO_TEST_EXPECT=baseline \
  node deploy/boxy/tests/http.cjs https://policywonk-sso.azurewebsites.net \
  "$fixtures_dir/fixtures.json" /tmp/boxy-baseline-report.json
# Deploy the candidate digest, then repeat with SSO_TEST_EXPECT=fixed and a new report.
rm "$fixtures_dir/"*
rmdir "$fixtures_dir"
```

The baseline must have diagnostics enabled but retain the unpatched SAML
library. Its expected result is 5 authenticated flows and 23 denials, including
three valid encrypted responses rejected by the bug. The candidate must
complete all 8 valid flows and reject all 20 invalid responses. Download the
container logs after each run, then check the matching run's events:

```sh
node deploy/boxy/tests/logs.cjs /tmp/boxy-container.log /tmp/boxy-baseline-report.json
```

The report contains the random product/run identifier, expected variant, broker
origin, and each synthetic case's tenant, mode, expected outcome, and certificate
count. It contains no credentials, assertions, or tokens and is written only
after the complete HTTP matrix passes.
Logs must show the candidate's successful retry against the original encrypted
response and one redacted diagnostic per request. Restart TEST after collecting
evidence to clear its in-memory connections and sessions. Remove local disposable
key fixtures and clear `SSO_TEST_API_KEY` from the shell after the exercise.
Verify that the production broker and both applications' issuer settings remain
unchanged. These tests verify the hosted broker, including token exchange and
userinfo, without testing campus
attribute release or a real PolicyWonk application session.

## Deployment

The frontend pipeline builds and tests this image and pushes it on main, but does not deploy SSO automatically. The `policywonk-prod-sso` Azure app serves both TEST and production, so replacing its image affects both environments. Validate a new image locally with an isolated in-memory database first. Record the existing image and log settings before changing the shared app. Deploy an immutable tag/digest and verify startup, the admin page, and public campus redirects. A password-page redirect is not proof of successful SAML validation; a campus test login is still required.

Rollback by restoring the previous image URI. For troubleshooting, download the App Service logs and search for `"event":"saml_validation"`, then match tenant and UTC timestamp. The correlation ID groups the certificate attempts within one event; it is not sent back to the user's browser.
