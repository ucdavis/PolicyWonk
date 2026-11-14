# Deploying PolicyWonk

Azure Pipelines owns builds and deployments. GitHub hosts the code and required PR checks. CodeQL default setup scans JavaScript/TypeScript and Python. The old GitHub Actions deployment workflow is retired.

## Environments

The Next.js app serves the website and chat. The Python backend continuously ingests policies in Azure Container Instances.

| Component | Test | Production |
| --- | --- | --- |
| Subscription | UC Davis CAES Test | UC Davis CAES Production |
| Resource group | `policywonk-dev` | `policy` |
| Website | [policywonk-test](https://policywonk-test.azurewebsites.net) | [policywonk](https://policywonk.ucdavis.edu) |
| Worker | `policywonk-dev-backend` | `policywonk-prod-backend` |
| PostgreSQL server | `policywonk-dev-db` | `policywonk-prod-db` |
| Search index | `policy_vectorstore_test_v2` | `policy_vectorstore_production_v2` |
| Embedding model | `text-embedding-3-small` | `text-embedding-3-large` |

Both environments use the production registry, `policywonkcontainers.azurecr.io`, the same Elastic Cloud cluster, and the production SSO issuer, `https://policywonk-sso.ucdavis.edu`. Test has separate application data, but it cannot isolate a shared search-cluster or SSO upgrade. Different embedding models also mean retrieval quality can differ. These settings were checked on September 19, 2026.

Campus sign-in mappings live in `web/src/lib/constants.ts`. Each campus has an app group `value`, a Jackson `ssoTenant` for product `policywonk`, and explicit `affiliationScopes` for `eduPersonScopedAffiliation`. Berkeley uses `ucb`, `ucberkeley`, and `berkeley.edu`, respectively. Keep the app group stable to preserve URLs and saved-chat grouping. A Jackson connection must allow the `/api/auth/callback/boxyhq-saml` URL for each environment where that campus is enabled.

The UCLA, Merced, Riverside, and San Diego connections use tenants `ucla`, `ucmerced`, `ucr`, and `ucsd`. Their InCommon entity IDs are `urn:mace:incommon:<campus>.edu`; each connection imports metadata from `https://mdq.incommon.org/entities/<entityID>`. The login and location pages both use the campus list, and new campuses receive the shared UCOP policy and union-contract choices. Campus sign-in does not add local policy sources.

These additional connections complete the current UCPath location list, excluding Former Employees. Each uses the same identifier for its app group and Jackson tenant. Import their metadata from `https://mdq.incommon.org/entities/<URL-encoded entity ID>`.

| Location | Tenant | Affiliation scopes | InCommon entity ID |
| --- | --- | --- | --- |
| UC Santa Cruz | `ucsc` | `ucsc.edu` | `urn:mace:incommon:ucsc.edu` |
| Lawrence Berkeley National Laboratory | `lbl` | `lbl.gov` | `urn:mace:incommon:lbl.gov` |
| UC Irvine | `uci` | `uci.edu` | `urn:mace:incommon:uci.edu` |
| UC Santa Barbara | `ucsb` | `ucsb.edu` | `urn:mace:incommon:ucsb.edu` |
| UC Agriculture and Natural Resources | `ucanr` | `ucanr.edu` | `https://ucanridp.ucanr.edu/idp/shibboleth` |
| UC Law San Francisco | `uclawsf` | `uclawsf.edu`, `uchastings.edu` | `https://shibboleth.uchastings.edu/idp/shibboleth` |

Berkeley Lab is separate from UC Berkeley/CalNet, and UC Law SF is separate from UCSF. UC Law SF retains its legacy Hastings entity ID and publishes both affiliation scopes. These connections can be configured from their published metadata before coordinating a user sign-in test with the institution.

For a TEST-first rollout, allow only `https://policywonk-test.azurewebsites.net/api/auth/callback/boxyhq-saml` on new Jackson connections and set their default redirect to the TEST site. Add the production callback when promoting that campus. Confirm attribute release and complete sign-in with a campus tester before calling access verified. The UC San Diego option uses UCSD's published IdP and `ucsd.edu` scope. No separate Health login is configured.

## Release flow

- [Frontend pipeline 41](https://dev.azure.com/ucdavis/Policy%20Wonk/_build?definitionId=41) uses `azure-pipelines.yml`.
- [Worker pipeline 49](https://dev.azure.com/ucdavis/Policy%20Wonk/_build?definitionId=49) uses `azure-pipelines-backend.yml`.

Each pipeline keeps three stages: `BuildPush` → `DeployTest` → `DeployProd`.

1. PRs build the affected component when its directory or pipeline YAML changes. The frontend Docker build runs the existing ESLint and Vitest checks using its installed dependencies. The worker build requires the [offline backend checks](../backend/README.md#installing-dependencies) to pass. PRs do not push images or deploy.
2. A successful build on `main` pushes an image tagged with the full commit SHA and deploys it to test. The frontend checks that `/auth/login` returns HTTP 200, with retries for startup.
3. CAES Developers test the candidate, then approve the existing Azure DevOps `prod` environment gate. Production receives the same image tag and repeats the login-page check.

The HTTP check proves the login page responds. It does not verify the running revision, database/search access, SSO, chat, or ingestion. Before approving production:

- Confirm the test app or worker is configured with the pipeline's image SHA. If a newer run has replaced test, redeploy the intended candidate before testing it.
- For the frontend, sign in normally, ask a policy question, open its citations, and reload the saved conversation.
- For the worker, check startup logs and observe a controlled test source refresh. Confirm a successful `index_attempts` record, expected indexed documents, and retrieval through the test website. Do not use database reset scripts as deployment tests.
- Record the tested SHA and results in the production approval comment. Reject the release if verification fails.

Repeat the relevant functional check after production deployment. Check the **DeployProd stage**, not just the overall run badge: an expired approval can leave production skipped while the run appears successful. Frontend and worker releases are independent, so their deployed SHAs may differ.

## Merge requirements

The active `main` ruleset requires a PR, an up-to-date branch, and the Azure Pipelines checks `ucdavis.PolicyWonk` and `ucdavis.PolicyWonk Backend`. Force-push and deletion are blocked. These settings live in GitHub; the production approval lives in [Azure DevOps environments](https://dev.azure.com/ucdavis/Policy%20Wonk/_environments).

Keep the component path filters. Azure Pipelines [reports a neutral check when paths exclude a PR](https://learn.microsoft.com/en-us/azure/devops/release-notes/2021/sprint-194-update), and GitHub [accepts neutral required checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks). Unrelated changes do not need both Docker builds.

## BoxyHQ source build

`deploy/boxy/Dockerfile` builds Jackson 1.42.0 and saml20 1.10.0 from pinned,
checksum-verified source archives. Readable source patches add diagnostics and
fix encrypted-response verification with multiple trusted signing certificates.
See [SSO source build and diagnostics](boxy/README.md) for the patch mechanism,
regression tests, and upgrade procedure.

The image retains Node.js 22.23.4, the patched runtime selected for
[CVE-2026-111497](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases).
Native dependencies are rebuilt on the pinned Node image. The application starts
with `node server.js`; the manual migration tools are installed from a lockfile.
This source-build alternative has not been deployed to the shared SSO service.

The frontend pipeline also builds this SSO image on PRs. Only a successful build
on `main` pushes it as `policywonkcontainers.azurecr.io/policywonk-sso:<commit SHA>`.
The pipeline does not deploy SSO. `boxy.bicep` requires an explicit
`containerImage` parameter so it cannot fall back to the unpatched public image.

For a future, separately approved SSO release, record the current image and
configuration, verify the target App Service can pull from the private registry,
and select the retained image for the reviewed commit. Use a test SSO instance
with a test database and a test client pointed at that issuer. The shared
production issuer used by the test website does not isolate SSO testing. Verify
normal sign-in, callback/session creation, and logout before production approval.
Check the version and database of any separate test SSO instance before changing
it. Do not apply `boxy.bicep` without reviewing its service-plan and environment
parameters.

Local image checks, without Azure changes:

```sh
docker build --platform linux/amd64 -t policywonk-sso:source deploy/boxy
bash deploy/boxy/tests/run.sh policywonk-sso:source
```

## Schema changes and rollback

Alembic in `backend/alembic` owns schema migrations. Neither pipeline applies migrations automatically. Before a schema change, compare `alembic_version`, review the migration, verify a recoverable backup, and plan compatible frontend/worker deployment order. Apply the reviewed migration once per environment before promoting dependent code.

Before production approval, record the current image tags. To roll back, redeploy the previous retained image after checking its compatibility with the current database and index, then repeat functional checks. Avoid rebuilding an old SHA because dependencies or base images may have changed. Worker rollback does not undo database or search writes; ingestion deletes old vectors before writing replacements.

## Infrastructure follow-up

The existing `frontend.bicep`, `boxy.bicep`, and `network.sh` are provisioning aids, not a complete definition of the running environments. Review their changes before reapplying them, especially the frontend app-settings resource, which includes registry credentials. [SSO setup notes](https://www.notion.so/caes-cru/SAML-Shibboleth-1b4e70f6741180d9b780fb1354c0b380?pvs=4) cover the Jackson integration.

The ACR build connection already uses federation. The two ARM deployment connections use service-principal secrets, and runtime image pulls use registry credentials. A separate identity migration can use Bicep for identities, `AcrPull` grants, and federated credentials, plus Azure CLI/API changes for service connections and app/worker configuration. Validate test before cutting over production or removing old credentials. This pipeline cleanup does not perform that migration.
