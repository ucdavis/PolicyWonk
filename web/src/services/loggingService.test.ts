import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/auth', () => ({
  auth: async () => ({ userId: 1, user: { name: 'Test' } }),
}));
vi.mock('./chatService', () => ({ llmModel: 'unchanged-model' }));
vi.mock('@/lib/db', () => ({
  default: {
    $transaction: async (
      operation: (transaction: unknown) => Promise<unknown>
    ) => operation({ $executeRaw: vi.fn(), chats: { create } }),
  },
}));

import { focuses } from '@/models/focus';

let server: Server;
const messages = [{ id: 'm', role: 'user' as const, content: 'Question' }];
beforeEach(() => {
  vi.resetModules();
  create.mockResolvedValue({ id: 'saved' });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(async () => {
  server?.closeAllConnections();
  if (server) {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
async function listen() {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  vi.stubEnv(
    'ELASTIC_URL',
    `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  );
}

it('keeps the saved answer when the installed Elastic client times out on a stalled telemetry write', async () => {
  const requests: string[] = [];
  let logged: unknown;
  server = createServer(async (req, res) => {
    requests.push(req.method!);
    if (req.method === 'HEAD') {
      res.setHeader('x-elastic-product', 'Elasticsearch');
      res.end();
    } else {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      logged = JSON.parse(Buffer.concat(chunks).toString());
    }
  });
  await listen();
  const { saveChat } = await import('./historyService');
  await expect(
    saveChat('saved', messages, 'ucdavis', focuses[0])
  ).resolves.toEqual({
    status: '200',
    data: true,
  });
  expect(create).toHaveBeenCalledOnce();
  expect(requests).toEqual(['HEAD', 'PUT']);
  expect(logged).toMatchObject({ user: 'Test', messages });
  expect(console.warn).toHaveBeenCalledWith('Chat telemetry write failed');
});

it.each(['lookup', 'creation', 'write'])(
  'cancels telemetry during index %s without starting a subsequent request',
  async (stage) => {
    const started = Promise.withResolvers<void>();
    const requests: string[] = [];
    server = createServer((req, res) => {
      requests.push(req.method!);
      res.setHeader('x-elastic-product', 'Elasticsearch');
      if (req.method === 'HEAD' && stage !== 'lookup') {
        res.statusCode = stage === 'creation' ? 404 : 200;
        res.end();
      } else {
        started.resolve();
      }
    });
    await listen();
    const { logMessages } = await import('./loggingService');
    const controller = new AbortController();
    const logging = logMessages('saved', messages, 'Test', controller.signal);
    const failed = expect(logging).rejects.toThrow();
    await started.promise;
    controller.abort();
    await failed;
    expect(requests).toEqual(stage === 'lookup' ? ['HEAD'] : ['HEAD', 'PUT']);
  }
);
