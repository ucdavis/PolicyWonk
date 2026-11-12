import { NextRequest } from 'next/server';
import { beforeEach, expect, it, vi } from 'vitest';

const { auth, search, getEmbeddings, retrieve } = vi.hoisted(() => ({
  auth: vi.fn(),
  search: vi.fn(),
  getEmbeddings: vi.fn(),
  retrieve: vi.fn(),
}));
vi.mock('@/auth', () => ({ auth }));
vi.mock('@/lib/elastic', () => ({
  searchClient: { search },
  indexName: 'contracts_v2',
}));
vi.mock('@/services/chatService', () => ({
  getEmbeddings,
  getSearchResultsElastic: retrieve,
}));
vi.mock('@/services/historyService', () => ({ saveChat: vi.fn() }));
import { POST } from '../chat/route';

import { GET } from './route';

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: 1, user: { name: 'Test' } });
});

it('authenticates catalog access and validates group before querying', async () => {
  auth.mockResolvedValueOnce(null);
  expect(
    (await GET(new NextRequest('https://example.org/api/unions?group=ucdavis')))
      .status
  ).toBe(401);
  expect(
    (await GET(new NextRequest('https://example.org/api/unions?group=unknown')))
      .status
  ).toBe(400);
  expect(search).not.toHaveBeenCalled();
});

it('surfaces a catalog outage in both selection and chat, with no default-scope search', async () => {
  search.mockRejectedValue(new Error('offline'));
  expect(
    (await GET(new NextRequest('https://example.org/api/unions?group=ucdavis')))
      .status
  ).toBe(503);
  const result = await POST(
    new Request('https://example.org/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        group: 'ucdavis',
        focus: 'unions',
        subFocus: 'sv',
        messages: [
          {
            id: 'user-1',
            role: 'user',
            parts: [{ type: 'text', text: 'Question' }],
          },
        ],
      }),
    })
  );
  expect(result.status).toBe(503);
  expect(getEmbeddings).not.toHaveBeenCalled();
});

it('validates against exactly the units offered by the selector endpoint', async () => {
  search.mockResolvedValue({
    timed_out: false,
    _shards: { failed: 0 },
    aggregations: {
      documents: {
        buckets: [
          {
            document: {
              hits: {
                hits: [
                  {
                    _source: {
                      metadata: {
                        bargaining_units: [
                          { code: 'ZZ', name: 'New Unit', campuses: ['all'] },
                          {
                            code: 'K3',
                            name: 'Davis Craft',
                            campuses: ['ucdavis'],
                          },
                        ],
                        keywords: ['ZZ', 'K3'],
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  });
  const catalog = await GET(
    new NextRequest('https://example.org/api/unions?group=ucb')
  );
  expect(await catalog.json()).toEqual({
    unions: [{ key: 'zz', value: 'New Unit' }],
  });
  getEmbeddings.mockResolvedValue([[1]]);
  retrieve.mockRejectedValue(new Error('Stop after retrieval'));
  for (const subFocus of ['zz', 'k3']) {
    const response = await POST(
      new Request('https://example.org/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          group: 'ucb',
          focus: 'unions',
          subFocus,
          messages: [
            {
              id: 'user-1',
              role: 'user',
              parts: [{ type: 'text', text: 'Question' }],
            },
          ],
        }),
      })
    );
    const body = await response.text();
    if (subFocus === 'zz') {
      expect(response.status).toBe(200);
      expect(retrieve).toHaveBeenCalledWith(
        [[1]],
        expect.objectContaining({ name: 'unions', subFocus: 'zz' }),
        'Question',
        expect.any(AbortSignal)
      );
    } else {
      expect(response.status).toBe(400);
      expect(body).toBe(
        'This bargaining unit is unavailable for this campus. Choose another focus.'
      );
    }
  }
  expect(getEmbeddings).toHaveBeenCalledOnce();
  expect(retrieve).toHaveBeenCalledOnce();
});
