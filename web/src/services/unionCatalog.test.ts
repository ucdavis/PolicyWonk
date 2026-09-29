import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { search } = vi.hoisted(() => ({ search: vi.fn() }));
vi.mock('@/lib/elastic', () => ({
  searchClient: { search },
  indexName: 'contracts_v2',
}));
import { getFocusWithSubFocus } from '@/models/focus';

import {
  CATALOG_TTL_MS,
  createUnionCatalog,
  loadIndexedUnits,
  resolveFocus,
  type UnitAssociation,
} from './unionCatalog';

const units: UnitAssociation[] = [
  { code: 'SV', name: 'Student Services', campuses: ['all'] },
  { code: 'RP', name: 'Research Professionals', campuses: ['all'] },
  { code: 'K3', name: 'Davis Skilled Craft', campuses: ['ucdavis'] },
  { code: 'K2', name: 'Berkeley Skilled Craft', campuses: ['ucb'] },
  { code: 'M2', name: 'UCSF Residents', campuses: ['ucsf'] },
];
const page = (associations: UnitAssociation[], after?: string) => ({
  timed_out: false,
  _shards: { failed: 0 },
  aggregations: {
    documents: {
      buckets: associations.length
        ? [
            {
              document: {
                hits: {
                  hits: [
                    {
                      _source: {
                        metadata: {
                          bargaining_units: associations,
                          keywords: associations.map((unit) => unit.code),
                        },
                      },
                    },
                  ],
                },
              },
            },
          ]
        : [],
      ...(after ? { after_key: { url: after } } : {}),
    },
  },
});

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.useRealTimers());

describe('catalog availability and campus associations', () => {
  it('preserves pairs on a shared PDF and reads every page without unit cross-products', async () => {
    search
      .mockResolvedValueOnce(page([units[0], units[2], units[3]], 'pdf1'))
      .mockResolvedValueOnce(page([units[1], units[4]]));
    const getCatalog = createUnionCatalog(loadIndexedUnits);
    expect(
      (await getCatalog('ucdavis')).map((unit) => unit.key).sort()
    ).toEqual(['k3', 'rp', 'sv']);
    expect((await getCatalog('ucb')).map((unit) => unit.key).sort()).toEqual([
      'k2',
      'rp',
      'sv',
    ]);
    expect((await getCatalog('ucsf')).map((unit) => unit.key).sort()).toEqual([
      'm2',
      'rp',
      'sv',
    ]);
    expect((await getCatalog('ucop')).map((unit) => unit.key).sort()).toEqual([
      'rp',
      'sv',
    ]);
    expect(search.mock.calls[1][0].aggs.documents.composite.after).toEqual({
      url: 'pdf1',
    });
    expect(search.mock.calls[0][0].query.bool.filter).toContainEqual({
      exists: { field: 'vector' },
    });
  });

  it('adds newly indexed units when the shared cache expires, coalescing concurrent loads', async () => {
    let time = 0;
    const load = vi
      .fn()
      .mockResolvedValueOnce(units.slice(0, 1))
      .mockResolvedValue(units);
    const catalog = createUnionCatalog(load, () => time);
    await Promise.all([catalog('ucop'), catalog('ucdavis')]);
    expect(load).toHaveBeenCalledTimes(1);
    time = CATALOG_TTL_MS - 1;
    expect(await catalog('ucop')).toEqual([
      { key: 'sv', value: 'Student Services' },
    ]);
    time += 1;
    expect((await catalog('ucop')).map((unit) => unit.key)).toEqual([
      'rp',
      'sv',
    ]);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('fails explicitly after cache expiry, then retries instead of caching the failure', async () => {
    let time = 0;
    const load = vi
      .fn()
      .mockResolvedValueOnce(units)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(units);
    const catalog = createUnionCatalog(load, () => time);
    await catalog('ucop');
    time = CATALOG_TTL_MS;
    await expect(catalog('ucop')).rejects.toThrow('offline');
    expect(await catalog('ucop')).toHaveLength(2);
  });

  it('omits units without indexed contracts or the keyword needed by retrieval', async () => {
    search.mockResolvedValueOnce(page([]));
    expect(await loadIndexedUnits()).toEqual([]);
    const response = page([units[0]]);
    response.aggregations.documents.buckets[0].document.hits.hits[0]._source.metadata.keywords =
      [];
    search.mockResolvedValueOnce(response);
    expect(await loadIndexedUnits()).toEqual([]);
  });

  it.each([
    { timed_out: true },
    { _shards: { failed: 1 } },
    { aggregations: {} },
  ])('rejects incomplete results: %j', async (failure) => {
    search.mockResolvedValue({ ...page(units), ...failure });
    await expect(loadIndexedUnits()).rejects.toThrow();
  });

  it('rejects unknown campus labels rather than exposing them systemwide', async () => {
    search.mockResolvedValue(
      page([
        { ...units[0], campuses: ['unknown'] } as unknown as UnitAssociation,
      ])
    );
    await expect(loadIndexedUnits()).rejects.toThrow();
  });

  it('uses catalog names for SV/RP links and rejects a local unit in another campus', async () => {
    search.mockResolvedValue(page(units));
    expect(await resolveFocus('ucdavis', 'unions', 'SV')).toMatchObject({
      subFocus: 'sv',
      description: 'Student Services (sv)',
    });
    expect(await resolveFocus('ucop', 'unions', 'rp')).toMatchObject({
      subFocus: 'rp',
      description: 'Research Professionals (rp)',
    });
    await expect(resolveFocus('ucb', 'unions', 'k3')).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      resolveFocus('ucdavis', 'unions', 'unknown')
    ).rejects.toMatchObject({ status: 400 });
    await expect(resolveFocus('ucdavis', 'unions')).rejects.toMatchObject({
      status: 400,
    });
    expect(await resolveFocus('ucb')).toMatchObject({ name: 'ucop' });
    expect(getFocusWithSubFocus('unions', 'sv')).toBeUndefined();
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + CATALOG_TTL_MS + 1);
    search.mockRejectedValue(new Error('offline'));
    await expect(resolveFocus('ucdavis', 'unions', 'sv')).rejects.toMatchObject(
      { status: 503 }
    );
  });
});
