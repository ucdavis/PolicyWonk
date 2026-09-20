# Deploying PolicyWonk

Azure Pipelines builds and deploys PolicyWonk. GitHub hosts the code, required PR checks, and CodeQL security scanning.

## Environments and components

The Next.js application serves the website and chat requests. The Python backend is a continuously running policy ingestion worker in Azure Container Instances, not an HTTP API.

| Component | Test | Production |
| --- | --- | --- |
| Subscription | UC Davis CAES Test | UC Davis CAES Production |
| Subscription ID | `105dede4-4731-492e-8c28-5121226319b0` | `003283b1-cc5e-417a-b037-01ff3c05537b` |
| Resource group | `policywonk-dev` | `policy` |
| Web app | `policywonk-test` | `policywonk` |
| Website | https://policywonk-test.azurewebsites.net | https://policywonk.ucdavis.edu |
| Worker | `policywonk-dev-backend` | `policywonk-prod-backend` |
| PostgreSQL server | `policywonk-dev-db` | `policywonk-prod-db` |
| Application database | `policywonk` | `policywonk` |
| Search index | `policy_vectorstore_test_v2` | `policy_vectorstore_production_v2` |
| Embedding model | `text-embedding-3-small` | `text-embedding-3-large` |
| Frontend SSO issuer | https://policywonk-sso.ucdavis.edu | https://policywonk-sso.ucdavis.edu |

Both environments pull images from `policywonkcontainers.azurecr.io` in the production subscription. Both use the same Elastic Cloud cluster. The separate test SSO app, `policywonk-sso`, exists but is not the test frontend's configured issuer. These settings were inspected on September 19, 2026. Recheck them before changing integrations.

Test therefore provides separate application data but cannot independently rehearse a shared Elasticsearch or production SSO upgrade. Retrieval quality also differs with the embedding model. Changing models requires a compatible index and controlled reindexing.

## Pipelines and release flow

- [Frontend pipeline 41](https://dev.azure.com/ucdavis/Policy%20Wonk/_build?definitionId=41) uses `azure-pipelines.yml`.
- [Ingestion pipeline 49](https://dev.azure.com/ucdavis/Policy%20Wonk/_build?definitionId=49) uses `azure-pipelines-backend.yml`.
- [Environment approvals](https://dev.azure.com/ucdavis/Policy%20Wonk/_environments) are configured in Azure DevOps. The existing `prod` approval belongs to `[ucdavis]\CAES Developers`.

Every PR to `main` runs both builds so required checks report a result even for documentation changes. PR runs do not push images or deploy. On `main`, component paths, the corresponding pipeline YAML, and shared deployment templates/scripts/tests trigger the affected pipelines.

Each pipeline follows this sequence:

1. Validate the code and deployment checks; build the container. The frontend runs `npm ci`, Prisma generation, ESLint, and Vitest before its production Docker build. The backend runs Python compilation, deployment verification tests, and its Docker build.
2. Push the image only after successful validation on `main`. The image tag and baked `BUILD_REVISION` are the full source commit SHA.
3. Deploy that image to test and verify readiness.
4. Pause for test acceptance by CAES Developers. Record the tested commit and results in the approval comment. This gate rejects the release after 24 hours without acceptance.
5. Request the existing `prod` environment approval, then deploy the same image to production and verify it.
6. Publish a release summary with each stage's outcome. If production is skipped or any stage fails, the summary fails the release rather than reporting a completed production deployment.

Frontend and worker releases are independent. Their source SHAs can differ when only one component changes. Changes that require coordinated database or search changes need an explicitly planned rollout.

The test acceptance gate and production approval are separate: the first records functional testing; the second authorizes production. Required approvers, the existing production approval timeout, and pipeline permissions are Azure DevOps settings, not fully represented by the YAML.

## Automated verification

`GET /api/health` checks PostgreSQL with a read-only query and counts the configured Elasticsearch index using the application's search credentials. It returns only health status and the baked revision. Failures return HTTP 503. Checks share a short cache and have a bounded response time; no credentials or dependency error bodies are returned.

The frontend deployment script requires the exact expected SHA to be healthy, verifies the login page and configured SAML provider, then enables Always On and the `/api/health` App Service probe and verifies again. It waits up to ten minutes for readiness. The first deployment must contain the health endpoint before the probe is enabled.

The worker emits `POLICYWONK_READY` with its baked SHA and a UTC timestamp after Elasticsearch startup verification and a successful PostgreSQL source query. The deployment check requires the expected image, a running container, and a recent readiness marker from the current container instance. It does not trigger ingestion or expose raw container logs.

These checks establish startup, dependency connectivity, and the running source revision. They do not prove SSO sign-in, answer quality, successful writes, or ingestion completion. The acceptance gate covers those paths.

## Test acceptance

For a frontend release:

1. Check `/api/health` on the test website and match its full revision to the pipeline run. If a newer run has replaced test, redeploy the intended candidate to test before accepting it.
2. Sign in through the normal campus SSO flow. Check that the callback returns to the test host with the correct group and history access.
3. Ask a representative policy question in the intended scope. Confirm that text streams, the answer finishes, and citations open the correct documents.
4. Reload the page, reopen the saved conversation, and confirm both the question and answer persisted. Confirm another signed-in user's conversations remain inaccessible.
5. Record the SHA, checked scope, and result in the gate's approval comment. Reject on failure.

For a worker release:

1. Confirm the worker image, test database host, and test index match the table above before arranging an ingestion check.
2. Select an existing test source and observe its next normal refresh after this deployment. Arrange a bounded refresh with the source owner if needed. Do not use `reset_db.py` or `reset_to_dev_state.py` as deployment tests.
3. In the test database, verify a new successful `index_attempts` record for that source, its completion time, and expected document counts. Verify the corresponding document text and vectors in the test index.
4. Retrieve that source through the test website and check its citation. A fresh readiness marker alone does not satisfy this acceptance check.
5. Record the SHA, source ID, attempt ID, and result in the approval comment. If no controlled ingestion check can be completed, reject the gate.

A dedicated test identity would be needed to automate the full authenticated acceptance flow. Do not enable the development auth bypass on hosted environments.

## GitHub merge requirements

`github-main-ruleset.json` describes the main-branch policy: PRs, no deletion or force-push, an up-to-date branch, and these required Azure Pipelines checks tied to GitHub App ID 9426:

- `ucdavis.PolicyWonk`
- `ucdavis.PolicyWonk Backend`

The existing ruleset ID is `614642`. After both checks pass on this branch, apply the reviewed policy with `gh api --method PUT repos/ucdavis/PolicyWonk/rulesets/614642 --input deploy/github-main-ruleset.json`. Re-read the ruleset first if another administrator has changed it; preserve intentional bypasses and other rules. A JSON file in the repository does not itself activate branch protection.

## Database changes and rollback

Alembic in `backend/alembic` owns schema migrations. Prisma generates the frontend client from its checked-in schema. Neither pipeline automatically applies Alembic migrations in this change.

Before a schema release, compare the database's `alembic_version` with the intended revision, inspect the migration, verify a recoverable backup, and plan backward-compatible application/worker ordering. Apply a reviewed migration once per environment and verify it before dependent code is promoted. Avoid concurrent migration execution. A deployed container does not prove schema compatibility.

Before production approval, record the current web image and worker image. The pipeline publishes the candidate SHA and image in its summary; Azure deployment history and the image registry retain the deployment references.

To roll back, identify the last verified image and confirm its compatibility with the current database and search index. Redeploy that retained image, then repeat readiness and functional checks. Rebuilding an old SHA can produce a different image because base images and dependency ranges may have changed. Immutable digest promotion and a dedicated rollback action are follow-up work.

If rolling the frontend back to an image predating `/api/health`, clear the App Service health-check path as part of that controlled rollback and use the previous verification procedure. The older image cannot satisfy the new probe.

Worker rollback does not restore database or Elasticsearch writes. Ingestion deletes a document's old vectors before writing replacements. Pause or drain ingestion before a disruptive schema/index operation and verify affected documents afterward. Database restoration has not been exercised by these pipelines.

## Infrastructure and credentials

The legacy `frontend.bicep`, `boxy.bicep`, and `network.sh` are historical provisioning aids, not a complete definition of the running environments. In particular, `frontend.bicep` writes an app-settings resource containing registry credentials; do not rerun it as a general configuration update for a populated app.

The current ACR build connection already uses workload identity federation. The two ARM deployment connections still use service-principal secrets, and runtime image pulls use registry credentials. See [the identity migration plan](identity/README.md) and its additive Bicep templates. Applying those templates and cutting over existing services is a separate infrastructure operation.

## Local validation

From `web`, run `npm ci`, `npx prisma generate`, `npm run lint`, `npm test`, and `npm run build`. From the repository root, run `python3 -m unittest discover -s deploy/tests -v` and `python3 -m compileall -q backend`.

Build the production images with contexts `web` and `backend`; both accept `--build-arg BUILD_REVISION=<full SHA>`. Local environment files and Python virtual environments are excluded from their image contexts.

Azure Pipelines preview validates expanded templates without running a deployment. PR CI then validates the hosted build path. Live deployment and functional acceptance are verified only when the respective test and production stages actually run.
