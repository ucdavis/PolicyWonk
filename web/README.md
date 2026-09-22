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
then `gpt-6-luna` selects up to five before the existing full-document expansion.
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
