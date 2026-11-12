import { simulateReadableStream } from 'ai';
import { MockLanguageModelV3 } from 'ai/test';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const {
  auth,
  embed,
  search,
  findFirst,
  create,
  exists,
  index,
  modelFactory,
  transaction,
  executeRaw,
} = vi.hoisted(() => ({
  auth: vi.fn(),
  embed: vi.fn(),
  search: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  exists: vi.fn(),
  index: vi.fn(),
  modelFactory: vi.fn(),
  transaction: vi.fn(),
  executeRaw: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/auth', () => ({ auth }));
vi.mock('@/lib/elastic', () => ({
  searchClient: { search },
  indexName: 'contracts_v2',
}));
vi.mock('@elastic/elasticsearch', () => ({
  Client: class {
    indices = { exists, create: vi.fn() };
    index = index;
  },
}));
vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: () =>
    Object.assign(modelFactory, {
      embedding: () => ({ doEmbed: embed }),
      responses: modelFactory,
    }),
}));
vi.mock('@/lib/db', () => ({
  default: {
    $transaction: transaction,
  },
}));

const session = (userId: number) => ({ userId, user: { name: 'Test' } });
const request = (signal?: AbortSignal, union = false) =>
  new Request('http://localhost/api/chat', {
    method: 'POST',
    signal,
    body: JSON.stringify({
      group: 'ucb',
      ...(union ? { focus: 'unions', subFocus: 'zz' } : {}),
      messages: [
        { id: 'm', role: 'user', parts: [{ type: 'text', text: 'Question' }] },
      ],
    }),
  });
const hits = [0, 1].map((id) => ({
  _id: String(id),
  _source: {
    text: `Evidence ${id}`,
    metadata: {
      title: `Policy ${id}`,
      url: `https://example.org/${id}`,
      hash: String(id),
      doc_tokens: 10,
    },
  },
}));
const catalogPage = {
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
                      ],
                      keywords: ['ZZ'],
                    },
                  },
                },
              ],
            },
          },
        },
      ],
      after_key: { url: 'next-page' },
    },
  },
};
const cleanups: (() => void)[] = [];
function deferred<T>() {
  const pending = Promise.withResolvers<T>();
  cleanups.push(() => pending.resolve(undefined as T));
  return pending;
}
const flush = () => vi.advanceTimersByTimeAsync(0);
let POST: typeof import('./route').POST;
let model: MockLanguageModelV3;

beforeEach(async () => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.stubEnv('RERANK_ENABLED', 'false');
  auth.mockResolvedValue(session(1));
  embed.mockResolvedValue({ embeddings: [[1]] });
  search.mockResolvedValue({ hits: { hits } });
  findFirst.mockResolvedValue(null);
  transaction.mockImplementation(async (operation) =>
    operation({
      $executeRaw: executeRaw,
      documents: { findFirst },
      chats: { create },
    })
  );
  create.mockResolvedValue({ id: 'saved' });
  exists.mockResolvedValue(true);
  index.mockResolvedValue({});
  model = new MockLanguageModelV3({
    doStream: async () => ({
      stream: simulateReadableStream({
        initialDelayInMs: null,
        chunkDelayInMs: null,
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
  modelFactory.mockReturnValue(model);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  ({ POST } = await import('./route'));
});

afterEach(async () => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  await flush();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it.each(['disconnect', 'deadline', 'reader cancellation'])(
  'keeps both user slots during a blocked document lookup after %s',
  async (reason) => {
    const lookup = deferred<null>();
    findFirst.mockReturnValue(lookup.promise);
    const controller = new AbortController();
    const responses = [
      await POST(request(controller.signal)),
      await POST(request(controller.signal)),
    ];
    const completed: string[] = [];
    const bodies =
      reason === 'reader cancellation'
        ? []
        : responses.map((response) =>
            response.text().then((body) => completed.push(body))
          );
    await flush();
    expect(findFirst).toHaveBeenCalledTimes(2);
    if (reason === 'deadline') {
      await vi.advanceTimersByTimeAsync(180_000);
    } else if (reason === 'reader cancellation') {
      await Promise.all(responses.map((response) => response.body!.cancel()));
    } else {
      controller.abort();
    }
    await flush();
    if (reason !== 'reader cancellation') {
      expect(completed).toHaveLength(2);
      completed.forEach((body) => {
        expect(body).toContain('"type":"abort"');
        expect(body).toContain('[DONE]');
        expect(body).not.toContain('chatId');
      });
    }
    expect((await POST(request())).status).toBe(429);
    lookup.resolve(null);
    await flush();
    expect(findFirst).toHaveBeenCalledTimes(2);
    expect(model.doStreamCalls).toHaveLength(0);
    expect(create).not.toHaveBeenCalled();
    await Promise.all(bodies);
    const replacement = await POST(request());
    expect(replacement.status).toBe(200);
    const body = await replacement.text();
    expect(body).toContain('chatId');
    expect(body).toContain('[^0]: [Policy 0](https://example.org/0)');
  }
);

it('keeps all 20 process slots occupied until cancelled lookups settle', async () => {
  const lookup = deferred<null>();
  findFirst.mockReturnValue(lookup.promise);
  const controller = new AbortController();
  const bodies: Promise<string>[] = [];
  for (let userId = 1; userId <= 10; userId++) {
    auth.mockResolvedValue(session(userId));
    for (let question = 0; question < 2; question++) {
      const response = await POST(request(controller.signal));
      expect(response.status).toBe(200);
      bodies.push(response.text());
    }
  }
  await flush();
  expect(findFirst).toHaveBeenCalledTimes(20);
  controller.abort();
  await flush();
  await Promise.all(bodies);
  auth.mockResolvedValue(session(11));
  expect((await POST(request())).status).toBe(429);
  lookup.resolve(null);
  await flush();
  expect(findFirst).toHaveBeenCalledTimes(20);
  const replacement = await POST(request());
  expect(replacement.status).toBe(200);
  await replacement.text();
});

it.each(['persistence', 'telemetry'])(
  'closes responses at 180 seconds while charging pending %s',
  async (stage) => {
    const pending = deferred<{ id: string }>();
    const boundary = stage === 'persistence' ? create : index;
    boundary.mockReturnValue(pending.promise);
    const completed: string[] = [];
    const bodies = [];
    for (let question = 0; question < 2; question++) {
      const response = await POST(request());
      bodies.push(response.text().then((body) => completed.push(body)));
    }
    await flush();
    expect(boundary).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(180_000);
    expect(completed).toHaveLength(2);
    completed.forEach((body) => {
      expect(body).toContain('"type":"abort"');
      expect(body).toContain('[DONE]');
      expect(body).not.toContain('chatId');
    });
    expect((await POST(request())).status).toBe(429);
    pending.resolve({ id: 'saved' });
    await flush();
    if (stage === 'persistence') {
      expect(index).not.toHaveBeenCalled();
    }
    await Promise.all(bodies);
    const replacement = await POST(request());
    expect(replacement.status).toBe(200);
    expect(await replacement.text()).toContain('chatId');
  }
);

it('cancels catalog waiters without cancelling the shared load or freeing their slots early', async () => {
  const load = deferred<typeof catalogPage>();
  search.mockImplementation(({ size }) =>
    size === 0 ? load.promise : { hits: { hits } }
  );
  const controller = new AbortController();
  const first = POST(request(controller.signal, true));
  const second = POST(request(controller.signal, true));
  await flush();
  expect(search).toHaveBeenCalledOnce();
  const catalogSignal = search.mock.calls[0][1].signal as AbortSignal;
  controller.abort();
  expect((await first).status).toBe(408);
  expect((await second).status).toBe(408);
  expect((await POST(request(undefined, true))).status).toBe(429);
  expect(catalogSignal.aborted).toBe(false);
  auth.mockResolvedValue(session(2));
  const otherUser = POST(request(undefined, true));
  await flush();
  expect(search).toHaveBeenCalledOnce();
  const finalPage = structuredClone(catalogPage);
  delete (finalPage.aggregations.documents as { after_key?: unknown })
    .after_key;
  load.resolve(finalPage);
  const response = await otherUser;
  expect(response.status).toBe(200);
  expect(await response.text()).toContain('chatId');
  expect(embed).toHaveBeenCalledOnce();
  expect(search.mock.calls.filter(([query]) => query.size === 0)).toHaveLength(
    1
  );
  auth.mockResolvedValue(session(1));
  const replacement = await POST(request(undefined, true));
  expect(replacement.status).toBe(200);
  await replacement.text();
});

it('ends a stalled catalog response by the request deadline and never starts another page after timeout', async () => {
  const load = deferred<typeof catalogPage>();
  search.mockReturnValue(load.promise);
  const completed: Response[] = [];
  const waits = [1, 2].map(() =>
    POST(request(undefined, true)).then((response) => completed.push(response))
  );
  await flush();
  expect(search).toHaveBeenCalledOnce();
  await vi.advanceTimersByTimeAsync(180_000);
  expect(completed.map((response) => response.status)).toEqual([408, 408]);
  expect((await POST(request())).status).toBe(429);
  load.resolve(catalogPage);
  await flush();
  expect(search).toHaveBeenCalledOnce();
  expect(embed).not.toHaveBeenCalled();
  await Promise.all(waits);
  search.mockResolvedValue({ hits: { hits } });
  const replacement = await POST(request());
  expect(replacement.status).toBe(200);
  await replacement.text();
});

it('includes authentication in the 180-second response deadline', async () => {
  const pending = deferred<ReturnType<typeof session>>();
  auth.mockReturnValue(pending.promise);
  const completed: Response[] = [];
  const response = POST(request()).then((value) => completed.push(value));
  await vi.advanceTimersByTimeAsync(180_000);
  expect(completed.map((value) => value.status)).toEqual([408]);
  pending.resolve(session(1));
  await response;
  await flush();
  expect(embed).not.toHaveBeenCalled();
});

it('preserves promoted documents, persistence, citations and telemetry within database budgets', async () => {
  findFirst.mockResolvedValue({
    documentContents: { content: 'Complete policy' },
  });
  const response = await POST(request());
  expect(response.status).toBe(200);
  const body = await response.text();
  expect(body).toContain('Answer [^0].');
  expect(body).toContain('chatId');
  expect(body).toContain('[DONE]');
  expect(findFirst).toHaveBeenCalledOnce();
  expect(create).toHaveBeenCalledOnce();
  expect(create.mock.calls[0][0].data.messages[0].content).toContain(
    'Complete policy'
  );
  expect(create.mock.calls[0][0].data.messages[2].content).toContain(
    '## Citations'
  );
  expect(index.mock.calls[0][0].body).toMatchObject({ user: 'Test' });
  expect(transaction).toHaveBeenCalledTimes(2);
  for (const [, options] of transaction.mock.calls) {
    expect(options).toEqual({ maxWait: 2_000, timeout: 15_000 });
  }
  expect(executeRaw.mock.calls.map(([sql]) => [...sql])).toEqual([
    ["SET LOCAL statement_timeout = '10s'"],
    ["SET LOCAL statement_timeout = '10s'"],
  ]);
});

it.each(['embedding', 'search'])(
  'starts no later work when cancellation happens during %s',
  async (stage) => {
    const pending = deferred<unknown>();
    const boundary = stage === 'embedding' ? embed : search;
    boundary.mockReturnValue(pending.promise);
    const controller = new AbortController();
    const response = await POST(request(controller.signal));
    const body = response.text();
    await flush();
    expect(boundary).toHaveBeenCalledOnce();
    controller.abort();
    expect(await body).toContain('"type":"abort"');
    pending.resolve(
      stage === 'embedding' ? { embeddings: [[1]] } : { hits: { hits } }
    );
    await flush();
    if (stage === 'embedding') {
      expect(search).not.toHaveBeenCalled();
    }
    expect(findFirst).not.toHaveBeenCalled();
    expect(model.doStreamCalls).toHaveLength(0);
    expect(create).not.toHaveBeenCalled();
  }
);

it('holds permits until stalled answer generation settles after the deadline', async () => {
  const stopped = deferred<void>();
  const stalled = new MockLanguageModelV3({
    doStream: async () => {
      await stopped.promise;
      return {
        stream: new ReadableStream({
          start(controller) {
            controller.close();
          },
        }),
      };
    },
  });
  modelFactory.mockReturnValue(stalled);
  const completed: string[] = [];
  const bodies = [];
  for (let question = 0; question < 2; question++) {
    const response = await POST(request());
    bodies.push(response.text().then((body) => completed.push(body)));
  }
  await flush();
  expect(stalled.doStreamCalls).toHaveLength(2);
  await vi.advanceTimersByTimeAsync(180_000);
  expect(completed).toHaveLength(2);
  expect((await POST(request())).status).toBe(429);
  stopped.resolve();
  await flush();
  expect(create).not.toHaveBeenCalled();
  await Promise.all(bodies);
  modelFactory.mockReturnValue(model);
  const replacement = await POST(request());
  expect(replacement.status).toBe(200);
  expect(await replacement.text()).toContain('chatId');
});
