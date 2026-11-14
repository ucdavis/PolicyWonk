# Source pins match the deployed Jackson 1.42.0 / saml20 1.10.0 releases.
FROM node:22.23.4-alpine@sha256:0e1754758c2df4cfa3e68d59e2e1b7374bb7fd9ea6328eaaacf15cc934af8202 AS source
RUN apk add --no-cache curl git openssl python3 make g++ libc6-compat
WORKDIR /app
RUN curl -fsSL https://codeload.github.com/ory/polis/tar.gz/0d2d849aa99b0a36ddd2f06fa11bd6307842d6e6 -o /tmp/jackson.tar.gz \
 && echo '5f4095bd9a4adb5cd3d6f2c04cc1233527882f83d04f4856c88cfbf21fa27e3f  /tmp/jackson.tar.gz' | sha256sum -c - \
 && tar -xzf /tmp/jackson.tar.gz --strip-components=1 -C /app \
 && rm /tmp/jackson.tar.gz
RUN mkdir -p vendor/saml20 \
 && curl -fsSL https://codeload.github.com/ory/saml20/tar.gz/fee694e7e88fed7f440c8787ff87fd5586aa7bdf -o /tmp/saml.tar.gz \
 && echo '3121df61694f64fdfd6865379c68553768f5298e0cb3a857cec92f955d4e2dd4  /tmp/saml.tar.gz' | sha256sum -c - \
 && tar -xzf /tmp/saml.tar.gz --strip-components=1 -C vendor/saml20 \
 && rm /tmp/saml.tar.gz
COPY patches/saml-*.patch patches/jackson-build.patch /patches/
RUN git apply --check /patches/jackson-build.patch && git apply /patches/jackson-build.patch
WORKDIR /app/vendor/saml20
RUN git apply --check /patches/saml-diagnostics.patch && git apply /patches/saml-diagnostics.patch \
 && git apply --check /patches/saml-encrypted-response.patch && git apply /patches/saml-encrypted-response.patch
RUN npm ci --no-audit --no-fund && npm run build

FROM source AS verified
WORKDIR /app
COPY diagnostics /app/sso-diagnostics
RUN npm ci --prefix sso-diagnostics --ignore-scripts --no-audit --no-fund
COPY tests /app/tests
# Fixtures use only freshly generated, disposable keys and synthetic identities.
RUN ln -s sso-diagnostics diagnostics && mkdir /fixtures \
 && node tests/fixtures.cjs /fixtures && node tests/baseline.cjs && node tests/image.cjs \
 && rm -rf /fixtures && npm prune --prefix sso-diagnostics --omit=dev --ignore-scripts

FROM source AS builder
WORKDIR /app
COPY --from=verified /app/sso-diagnostics /app/sso-diagnostics
ENV NEXT_TELEMETRY_DISABLED=1
# Keep native dependency installation enabled, but replace upstream's nested
# npm install lifecycle with explicit lockfile-based installs.
RUN apk add --no-cache py3-setuptools
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY --from=verified /app/vendor/saml20/dist /app/vendor/saml20/dist
COPY patches/jackson-diagnostics.patch /patches/jackson-diagnostics.patch
RUN git apply --check /patches/jackson-diagnostics.patch && git apply /patches/jackson-diagnostics.patch
RUN npm run build

FROM node:22.23.4-alpine@sha256:0e1754758c2df4cfa3e68d59e2e1b7374bb7fd9ea6328eaaacf15cc934af8202 AS migration-tools
WORKDIR /opt/migration-tools
COPY migrations/package*.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:22.23.4-alpine@sha256:0e1754758c2df4cfa3e68d59e2e1b7374bb7fd9ea6328eaaacf15cc934af8202 AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=5225 \
    NODE_OPTIONS="--max-http-header-size=81920 --dns-result-order=ipv4first"
RUN apk add --no-cache libc6-compat \
 && addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=verified --chown=nextjs:nodejs /app/sso-diagnostics ./sso-diagnostics
# Preserve upstream's manual migration command without unpinned global installs.
COPY --from=migration-tools /opt/migration-tools /opt/migration-tools
COPY --from=source --chown=nextjs:nodejs /app/migrate.sh ./migrate.sh
COPY --from=source --chown=nextjs:nodejs /app/npm ./npm
USER nextjs
EXPOSE 5225
CMD ["node", "server.js"]
