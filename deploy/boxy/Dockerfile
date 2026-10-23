# Keep Jackson's application and native modules on the production release while
# replacing its Node 22 runtime with the CVE-2026-111497 security release.
FROM node:22.23.4-alpine AS node-runtime
FROM boxyhq/jackson:1.42.0@sha256:90d91d80e5683250d9da72e057eac9e7484097dba4b6a46f14088dc189150bf6

COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
ENV NODE_VERSION=22.23.4

# Fail the build if the replacement binary cannot run on Jackson's Alpine base.
RUN test "$(node --version)" = "v22.23.4"
