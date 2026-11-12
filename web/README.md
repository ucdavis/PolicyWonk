# 📘 PolicyWonk: UCD Policy Expert always on call!

Welcome to **PolicyWonk**, your app for navigating the complex maze of UCOP (University of California Office of the President) and UC Davis policies! 🌟 Whether you're a student, faculty, staff, or administrator, understanding and complying with university policies is now easier than ever.

## How Can PolicyWonk Assist You?
- **Immediate Answers**: Got a policy question? Just ask, and PolicyWonk provides you with clear, concise answers, pronto! ✏️
- **Always Informed**: PolicyWonk's database is continuously updated, ensuring you get the most current policy information. 📅
- **Simple to Use**: Designed with user-friendliness in mind, PolicyWonk makes navigating policies as straightforward as chatting with a friend. 🤝

## How to Get Started?

[PolicyWonk Website](https://policywonk.ucdavis.edu)

## Sources:

See [UC Davis Policy Documents Repository](https://github.com/ucdavis/policy) for the full list of policies and procedures available ("ucdavis" github team member access required).

Sources include `UCOP Policies`, `UC Davis Administrative Policy Manuals`, and `UCOP Collective Bargaining Agreements`.

## Retrieval and reranking

Reranking is enabled by default. Hybrid search retrieves 40 candidate passages,
then the reranker selects up to five before the existing full-document expansion.
Set `OPENAI_RERANK_MODEL` to choose the model; it defaults to `gpt-6-luna`.
The reranker separately assesses whether the evidence answers all, part, or none
of the question. No supporting evidence produces the existing insufficient-information
response. For partial or unassessed evidence, the answer model must identify gaps
and use only supported facts. A model's assessment is not a correctness guarantee.

Set the server environment variable `RERANK_ENABLED=false` and restart the web
app to restore the previous five-result search and answer prompt, with no reranking
call. The flag is read at request time and does not require a frontend build.

Reranking uses the existing `OPENAI_API_KEY` through the Responses API. It has an
eight-second timeout, no retries, and a 250,000-character input bound. On failure
or oversized input, it uses the wider search's first five passages and treats
their relevance as unassessed. This fallback differs from disabling the feature,
which restores the original search. No ingestion or index changes are required.

Run deterministic retrieval, fallback, and citation tests from `web` with
`npm test`. Tests mock external services and do not incur API charges.


## Chat request and session safeguards

The proxy and chat/history mutations require an application session with a
positive integer user ID and a user object. Configuration-error sessions fail
closed. Logging helpers are internal server-only functions; feedback, sharing,
and deletion go through authenticated ownership checks. Elastic telemetry has
short timeouts and cannot turn a successful database save into a failed answer.

Chat accepts text-only user and assistant messages, ending with a user question.
It discards client metadata and provider options. Limits are 128 KiB per body,
40 messages, 8,000 characters per user message, and 48,000 characters across the
conversation. Retrieved answer context is capped at 160,000 characters and
answer output at 16,000 tokens, including reasoning where the provider counts it.
Bodies have 20 seconds to arrive; the request deadline is three minutes.
Cancellation reaches embedding, search, reranking, and answer generation.

Each app process permits 20 request starts per user per minute, two concurrent
requests per user, and 20 concurrent requests total. Rejections use HTTP 429 and
`Retry-After: 60`. These are process-local resource bounds, not a shared quota
across replicas or restarts. Existing answer, reranker, and embedding model
settings and search indexes are unchanged.

## Dependency maintenance follow-up

The November 2026 refresh retains Next 16, React 19, AI SDK 6, Prisma 6, and
Node 22. Zod moves to 4 for its security fix. Matching Next packages and React
types move together. Run `npm ci`, `npx prisma generate`, `npm test`,
`npm run lint`, and `npm run build` with Node 22.23.5.

Two distinct tooling advisories remain, reported as ten affected dependency
nodes by `npm audit` on November 12, 2026:

- [deepmerge-ts recursive object graphs](https://github.com/advisories/GHSA-ggr8-5vv4-36mx)
  is pulled in by Prisma's CLI configuration loader. Its supported parent fix
  requires Prisma 7. PolicyWonk uses the CLI at build time and does not load
  user-supplied Prisma configuration. npm also reports this chain with
  `--omit=dev` because the client has a CLI peer dependency. The standalone
  production build excludes `prisma`, `@prisma/config`, and `deepmerge-ts`.
- [minimatch glob amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249)
  is pulled in by TypeScript ESLint. The patched matcher is major 11, outside
  the current parent's range. Lint uses repository-owned patterns, and these
  packages are excluded from the standalone runtime.

Recheck supported parent releases before removing these deferrals. A clean
runtime bundle inspection does not replace dependency auditing or signed-in
acceptance. Before release, follow the TEST and production approval checks in
[the deployment guide](../deploy/README.md), including normal campus SSO,
streamed answers, citations, history, sharing, and logout.
