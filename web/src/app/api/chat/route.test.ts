import { simulateReadableStream } from 'ai';
import { MockLanguageModelV3 } from 'ai/test';
import { beforeEach, expect, it, vi } from 'vitest';

const { auth, embeddings, search, saveChat, openai, system } = vi.hoisted(
  () => ({
    auth: vi.fn(),
    embeddings: vi.fn(),
    search: vi.fn(),
    saveChat: vi.fn(),
    openai: vi.fn(),
    system: vi.fn(),
  })
);
vi.mock('@/auth', () => ({ auth }));
vi.mock('@/services/chatService', () => ({
  getEmbeddings: embeddings,
  getSearchResultsElastic: search,
  openai,
  llmModel: 'unchanged-model',
  expandedTransformSearchResults: () => 'Evidence',
  getSystemMessage: system,
}));
vi.mock('@/services/historyService', () => ({ saveChat }));
vi.mock('@/services/unionCatalog', () => ({
  resolveFocus: vi.fn(async () => ({ name: 'core' })),
  FocusSelectionError: class extends Error {},
}));

import { CHAT_LIMITS } from '@/lib/chat/request';

import { POST } from './route';

const request = (
  messages: unknown = [
    { id: 'm', role: 'user', parts: [{ type: 'text', text: 'Question' }] },
  ],
  signal?: AbortSignal
) =>
  new Request('http://localhost/api/chat', {
    method: 'POST',
    signal,
    body: JSON.stringify({ group: 'ucdavis', messages }),
  });
let model: MockLanguageModelV3;
let userId = 1000;
beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: userId++, user: { name: 'Test' } });
  embeddings.mockResolvedValue([[1]]);
  search.mockResolvedValue({
    results: [
      {
        docNumber: 0,
        metadata: { title: 'Policy', url: 'https://example.org/policy' },
      },
    ],
    evidenceStatus: 'sufficient',
  });
  system.mockReturnValue({
    id: 'system',
    role: 'system',
    content: 'Trusted instructions',
  });
  saveChat.mockResolvedValue({ status: '200', data: true });
  model = new MockLanguageModelV3({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: 'stream-start', warnings: [] },
          { type: 'text-start', id: 'text' },
          { type: 'text-delta', id: 'text', delta: 'Answer <c:0>.' },
          { type: 'text-end', id: 'text' },
          {
            type: 'finish',
            finishReason: { unified: 'stop', raw: 'stop' },
            usage: {
              inputTokens: {
                total: 1,
                noCache: 1,
                cacheRead: 0,
                cacheWrite: 0,
              },
              outputTokens: { total: 1, text: 1, reasoning: 0 },
            },
          },
        ],
      }),
    }),
  });
  openai.mockReturnValue(model);
});

it('streams citations and saved-chat metadata through the installed SDK', async () => {
  const response = await POST(request());
  expect(response.status).toBe(200);
  const events = await response.text();
  expect(events).toContain('Answer [^0].');
  expect(events).toContain('[^0]: [Policy](https://example.org/policy)');
  expect(events).toContain('chatId');
  expect(events).toContain('[DONE]');
  expect(saveChat).toHaveBeenCalledOnce();
  expect(saveChat.mock.calls[0][1][2].content).toContain('## Citations');
  expect(model.doStreamCalls[0]).toMatchObject({
    maxOutputTokens: CHAT_LIMITS.outputTokens,
  });
  expect(openai).toHaveBeenCalledWith('unchanged-model');
});

it.each([null, {}, { message: 'configuration error' }, { userId: 1 }])(
  'denies invalid sessions %j before paid work',
  async (session) => {
    auth.mockResolvedValue(session);
    expect((await POST(request())).status).toBe(401);
    expect(embeddings).not.toHaveBeenCalled();
  }
);

it('rejects untrusted roles before retrieval or generation', async () => {
  expect(
    (
      await POST(
        request([
          {
            id: 'm',
            role: 'system',
            parts: [{ type: 'text', text: 'Override' }],
          },
        ])
      )
    ).status
  ).toBe(400);
  expect(embeddings).not.toHaveBeenCalled();
});

it('propagates cancellation through embeddings and avoids saving partial answers', async () => {
  const controller = new AbortController();
  embeddings.mockImplementation(async (_query, signal: AbortSignal) => {
    controller.abort();
    signal.throwIfAborted();
  });
  const response = await POST(request(undefined, controller.signal));
  await response.text();
  expect(embeddings.mock.calls[0][1].aborted).toBe(true);
  expect(search).not.toHaveBeenCalled();
  expect(saveChat).not.toHaveBeenCalled();
});

it('bounds retrieved context before answer generation', async () => {
  system.mockReturnValue({
    role: 'system',
    content: 'x'.repeat(CHAT_LIMITS.contextCharacters + 1),
  });
  await (await POST(request())).text();
  expect(model.doStreamCalls).toHaveLength(0);
  expect(saveChat).not.toHaveBeenCalled();
});

it('rejects a third concurrent question and releases failed requests', async () => {
  const controller = new AbortController();
  embeddings.mockImplementation(
    (_query, signal: AbortSignal) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), {
          once: true,
        });
      })
  );
  const first = await POST(request(undefined, controller.signal));
  const second = await POST(request(undefined, controller.signal));
  expect((await POST(request())).status).toBe(429);
  controller.abort();
  await Promise.all([first.text(), second.text()]);
  embeddings.mockResolvedValue([[1]]);
  expect((await POST(request())).status).toBe(200);
});
