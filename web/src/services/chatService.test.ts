import type { TextStreamPart } from 'ai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createCitationsTransform } from '../lib/chat/citationsTransform';
import { focuses } from '../models/focus';

import {
  expandedTransformSearchResults,
  getSearchResultsElastic,
  getSystemMessage,
} from './chatService';
import { rerankPassages } from './rerankService';

const { search, findFirst } = vi.hoisted(() => ({
  search: vi.fn(),
  findFirst: vi.fn(),
}));
vi.mock('@elastic/elasticsearch', () => ({
  Client: class {
    search = search;
  },
}));
vi.mock('@/lib/db', () => ({ default: { documents: { findFirst } } }));
vi.mock('./rerankService', () => ({ rerankPassages: vi.fn() }));

const hits = Array.from({ length: 8 }, (_, i) => ({
  _id: `chunk-${i}`,
  _source: {
    text: `Evidence ${i}`,
    metadata: {
      title: `Policy ${i}`,
      url: `https://example.com/${i}`,
      hash: `hash-${i}`,
      doc_tokens: 100,
    },
  },
}));

describe('retrieval with optional reranking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('RERANK_ENABLED', 'true');
    search.mockImplementation(async ({ size }) => ({
      hits: { hits: hits.slice(0, size) },
    }));
    findFirst.mockResolvedValue(null);
    vi.mocked(rerankPassages).mockImplementation(async (_, candidates) => ({
      results: [candidates[6], candidates[1]],
      evidenceStatus: 'partial',
    }));
  });
  afterEach(() => vi.unstubAllEnvs());

  it('enables reranking when the flag is unset', async () => {
    vi.stubEnv('RERANK_ENABLED', undefined);
    await getSearchResultsElastic([[1]], focuses[0], 'Question');
    expect(rerankPassages).toHaveBeenCalledOnce();
    expect(search.mock.calls[0][0].size).toBe(40);
  });

  it('widens retrieval without changing fusion weights or focus filters', async () => {
    const focus = { ...focuses[0], name: 'unions' as const, subFocus: 'cx' };
    const enabled = await getSearchResultsElastic([[1, 2]], focus, 'Question');
    const wideQuery = search.mock.calls[0][0];
    expect(wideQuery.size).toBe(40);
    expect(wideQuery.body.knn).toMatchObject({ k: 40, num_candidates: 200 });
    expect(wideQuery.body.rank.rrf.rank_constant).toBe(10);
    expect(wideQuery.body.rank.rrf.window_size).toBe(100);
    expect(vi.mocked(rerankPassages).mock.calls[0][2]).toMatchObject({
      modelId: 'gpt-6-luna',
    });
    expect(enabled.results.map((r) => [r.id, r.docNumber])).toEqual([
      ['chunk-6', 0],
      ['chunk-1', 1],
    ]);

    vi.stubEnv('RERANK_ENABLED', 'false');
    const disabled = await getSearchResultsElastic([[1, 2]], focus, 'Question');
    const originalQuery = search.mock.calls[1][0];
    expect(originalQuery.size).toBe(5);
    expect(originalQuery.body.knn.k).toBe(5);
    expect(originalQuery.body.rank.rrf.rank_constant).toBe(10);
    expect(originalQuery.body.rank.rrf.window_size).toBeUndefined();
    expect(originalQuery.body.knn.filter).toEqual(wideQuery.body.knn.filter);
    expect(originalQuery.body.query).toEqual(wideQuery.body.query);
    expect(rerankPassages).toHaveBeenCalledTimes(1);
    expect(disabled.evidenceStatus).toBeUndefined();
    expect(disabled.results.map((r) => r.id)).toEqual(
      hits.slice(0, 5).map((h) => h._id)
    );
  });

  it('expands only a selected document, retaining citation targets after reordering', async () => {
    findFirst.mockImplementation(async ({ where }) => ({
      documentContents: { content: `Full document for ${where.url}` },
    }));
    const { results } = await getSearchResultsElastic(
      [[1]],
      focuses[0],
      'Question'
    );
    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(findFirst.mock.calls[0][0].where.url).toBe('https://example.com/6');
    expect(expandedTransformSearchResults(results)).toContain(
      'Document: 0\ntext: Full document for https://example.com/6'
    );
    const chunks = [
      { type: 'text-delta', id: 'text', text: 'Fact <c:0>, exception <c:1>.' },
      { type: 'finish-step' },
    ] as TextStreamPart<any>[];
    const input = new ReadableStream<TextStreamPart<any>>({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(chunk));
        controller.close();
      },
    });
    const reader = input
      .pipeThrough(
        createCitationsTransform({
          policies: results,
          onAssistantTextComplete: async () => {},
        })({ tools: {}, stopStream: () => {} })
      )
      .getReader();
    let output = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value.type === 'text-delta') {
        output += value.text;
      }
    }
    expect(output).toContain('[^0]: [Policy 6](https://example.com/6)');
    expect(output).toContain('[^1]: [Policy 1](https://example.com/1)');
  });

  it('does not load full documents when no evidence supports the question', async () => {
    vi.mocked(rerankPassages).mockResolvedValue({
      results: [],
      evidenceStatus: 'none',
    });
    const { results, evidenceStatus } = await getSearchResultsElastic(
      [[1]],
      focuses[0],
      'Lunch menu?'
    );
    expect(findFirst).not.toHaveBeenCalled();
    expect(results).toEqual([]);
    expect(
      getSystemMessage(expandedTransformSearchResults(results), evidenceStatus)
        .content
    ).toBe(
      "Reply with: Sorry, I couldn't find enough information to answer your question"
    );
  });

  it.each(['sufficient', 'partial', 'unassessed'] as const)(
    'passes coverage and grounding requirements to the answer prompt for %s',
    (status) => {
      // Assert the emitted model interface; live checks assess interpretation.
      const message = getSystemMessage('Document: 0\ntext: Evidence', status);
      expect(message.content).toContain(`assessed the evidence as ${status}`);
      expect(message.content).toContain(
        'explicitly identify the information you could not find'
      );
      expect(message.content).toContain('Document: 0\ntext: Evidence');
      expect(getSystemMessage('Evidence').content).not.toContain(
        '## Evidence requirements'
      );
    }
  );
});
