import { afterEach, expect, it, vi } from 'vitest';

const { search } = vi.hoisted(() => ({ search: vi.fn() }));
vi.mock('@elastic/elasticsearch', () => ({
  Client: class {
    search = search;
  },
}));
vi.mock('@/lib/db', () => ({ default: { documents: { findFirst: vi.fn() } } }));
vi.mock('./rerankService', () => ({ rerankPassages: vi.fn() }));
afterEach(() => vi.unstubAllEnvs());

it.each([
  ['policy_vectorstore_test_v2', 'metadata.source_type.keyword', 'UCCONTRACTS'],
  [
    'policy_vectorstore_test',
    'metadata.scope.keyword',
    'UCCOLLECTIVEBARGAINING',
  ],
])('preserves union retrieval in %s', async (index, field, scope) => {
  vi.resetModules();
  vi.stubEnv('ELASTIC_INDEX', index);
  vi.stubEnv('RERANK_ENABLED', 'false');
  search.mockResolvedValue({ hits: { hits: [] } });
  const { getSearchResultsElastic } = await import('./chatService');
  for (const code of ['sv', 'rp', 'zz']) {
    await getSearchResultsElastic(
      [[1, 2]],
      {
        name: 'unions',
        subFocus: code,
        description: 'Contract',
        groups: ['all'],
      },
      'Question'
    );
    const request = search.mock.lastCall![0];
    const expected = {
      bool: {
        must: [
          { terms: { 'metadata.keywords.keyword': [code.toUpperCase()] } },
          { terms: { [field]: [scope] } },
        ],
      },
    };
    expect(request.body.query.bool.filter).toEqual(expected);
    expect(request.body.knn.filter).toEqual(expected);
  }
});
