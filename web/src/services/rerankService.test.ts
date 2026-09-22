import { generateText } from 'ai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PolicyIndex } from '../models/chat';

import { rerankPassages } from './rerankService';

vi.mock('ai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('ai')>()),
  generateText: vi.fn(),
}));

const candidates = Array.from({ length: 7 }, (_, i) => ({
  id: `chunk-${i}`,
  docNumber: i,
  text: `Policy passage ${i}`,
  metadata: {
    title: 'A policy',
    url: 'https://example.com/policy',
    hash: 'policy-hash',
  },
})) as PolicyIndex[];

const respond = (output: unknown) => {
  vi.mocked(generateText).mockResolvedValue({ output } as Awaited<
    ReturnType<typeof generateText>
  >);
};

describe('rerankPassages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('preserves original evidence and distinct sections of one policy in selected order', async () => {
    respond({ evidenceStatus: 'partial', selectedIds: ['6', '1'] });
    const result = await rerankPassages('Question', candidates, 'test-model');
    expect(result.evidenceStatus).toBe('partial');
    expect(result.results).toEqual([candidates[6], candidates[1]]);
    expect(result.results[0]).toBe(candidates[6]);
    const request = vi.mocked(generateText).mock.calls[0][0];
    expect(request.maxRetries).toBe(0);
    expect(request.abortSignal).toBeInstanceOf(AbortSignal);
    expect(request.providerOptions?.openai).toMatchObject({
      forceReasoning: true,
      reasoningEffort: 'none',
    });
  });

  it('does not treat nonempty selections as evidence when coverage is none', async () => {
    respond({ evidenceStatus: 'none', selectedIds: ['1'] });
    expect(await rerankPassages('Question', candidates, 'test-model')).toEqual({
      results: [],
      evidenceStatus: 'none',
    });
  });

  it('removes exact duplicates without deleting different sections of that policy', async () => {
    respond({ evidenceStatus: 'sufficient', selectedIds: ['1', '0'] });
    const result = await rerankPassages(
      'Question',
      [candidates[0], { ...candidates[0], id: 'duplicate' }, candidates[1]],
      'test-model'
    );
    expect(result.results).toEqual([candidates[1], candidates[0]]);
    const payload = JSON.parse(
      vi.mocked(generateText).mock.calls[0][0].prompt as string
    );
    expect(payload.passages).toHaveLength(2);
  });

  it.each([
    ['duplicate IDs', ['0', '0']],
    ['unknown ID', ['999']],
    ['noncanonical ID', ['01']],
    ['empty supported selection', []],
  ])('falls back with unassessed evidence for %s', async (_, selectedIds) => {
    respond({ evidenceStatus: 'sufficient', selectedIds });
    expect(await rerankPassages('Question', candidates, 'test-model')).toEqual({
      results: candidates.slice(0, 5),
      evidenceStatus: 'unassessed',
    });
  });

  it.each([
    'provider failure',
    'refusal',
    'invalid structured output',
    'timeout',
  ])('falls back when generation fails: %s', async (message) => {
    vi.mocked(generateText).mockRejectedValue(new Error(message));
    expect(await rerankPassages('Question', candidates, 'test-model')).toEqual({
      results: candidates.slice(0, 5),
      evidenceStatus: 'unassessed',
    });
  });

  it('uses an eight-second abort signal and falls back when it aborts', async () => {
    const controller = new AbortController();
    const timeout = vi
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(controller.signal);
    vi.mocked(generateText).mockImplementation(
      ({ abortSignal }) =>
        new Promise((_, reject) => {
          abortSignal?.addEventListener('abort', () =>
            reject(abortSignal.reason)
          );
        })
    );
    const result = rerankPassages('Question', candidates, 'test-model');
    controller.abort(new DOMException('Timed out', 'TimeoutError'));
    expect((await result).evidenceStatus).toBe('unassessed');
    expect(timeout).toHaveBeenCalledWith(8_000);
  });

  it('does not call the model with no candidates or oversized input', async () => {
    expect(await rerankPassages('Question', [], 'test-model')).toEqual({
      results: [],
      evidenceStatus: 'none',
    });
    const result = await rerankPassages(
      'x'.repeat(250_001),
      candidates,
      'test-model'
    );
    expect(result.results).toEqual(candidates.slice(0, 5));
    expect(result.evidenceStatus).toBe('unassessed');
    expect(generateText).not.toHaveBeenCalled();
  });
});
