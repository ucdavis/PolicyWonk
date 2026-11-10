// Match the application's merged document numbers, while retaining the citation
// titles/URLs supplied by its deterministic footer transform.
export function buildJudgeEvidence(context) {
  return {
    documents:
      context.system.match(/<documents>\n([\s\S]*)\n<\/documents>/)?.[1] ?? "",
    citationCatalog: context.policies
      .filter(
        (p, i, all) =>
          all.findIndex((x) => x.metadata.hash === p.metadata.hash) === i,
      )
      .map((p) => ({
        number: p.docNumber,
        title: p.metadata.title,
        url: p.metadata.url,
      })),
  };
}
