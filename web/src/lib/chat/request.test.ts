import { expect, it } from 'vitest';

import { acquireChatRequest, CHAT_LIMITS, readChatRequest } from './request';

const body = (text = 'Question') => ({
  group: 'ucdavis',
  messages: [{ id: 'm1', role: 'user', parts: [{ type: 'text', text }] }],
});
const parse = (value: unknown) =>
  readChatRequest(
    new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify(value),
    }),
    new AbortController().signal
  );

it('accepts text and removes client metadata and provider options', async () => {
  const value = body();
  Object.assign(value.messages[0], {
    metadata: { secret: 'untrusted' },
    providerOptions: {},
  });
  const result = await parse(value);
  expect(result.userInput).toBe('Question');
  expect(result.messages).toEqual(body().messages);
});

it.each(['system', 'tool', 'function'])(
  'rejects client %s roles',
  async (role) => {
    const value = body();
    value.messages[0].role = role;
    await expect(parse(value)).rejects.toMatchObject({ status: 400 });
  }
);

it('rejects non-text content, empty input, and oversized message collections', async () => {
  await expect(
    parse({
      ...body(),
      messages: [
        {
          id: 'm',
          role: 'user',
          parts: [{ type: 'file', url: 'https://example.org' }],
        },
      ],
    })
  ).rejects.toMatchObject({ status: 400 });
  await expect(parse(body('   '))).rejects.toMatchObject({ status: 400 });
  await expect(
    parse({ ...body(), messages: Array(41).fill(body().messages[0]) })
  ).rejects.toMatchObject({ status: 400 });
  await expect(
    parse(body('x'.repeat(CHAT_LIMITS.userCharacters + 1)))
  ).rejects.toMatchObject({ status: 413 });
  await expect(
    parse({
      ...body(),
      messages: Array(7).fill(body('x'.repeat(8_000)).messages[0]),
    })
  ).rejects.toMatchObject({ status: 413 });
});

it('bounds actual body bytes when content-length is absent or dishonest', async () => {
  for (const headers of [
    new Headers(),
    new Headers({ 'content-length': '1' }),
  ]) {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers,
      body: 'x'.repeat(CHAT_LIMITS.bodyBytes + 1),
    });
    await expect(
      readChatRequest(req, new AbortController().signal)
    ).rejects.toMatchObject({ status: 413 });
  }
});

it('cancels a stalled request body', async () => {
  const controller = new AbortController();
  let cancelled = false;
  const req = new Request('http://localhost', {
    method: 'POST',
    body: new ReadableStream({
      cancel() {
        cancelled = true;
      },
    }),
    duplex: 'half',
  } as RequestInit);
  const pending = readChatRequest(req, controller.signal);
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  expect(cancelled).toBe(true);
});

it('limits concurrency per user and releases slots only once', () => {
  const first = acquireChatRequest(100)!;
  const second = acquireChatRequest(100)!;
  expect(acquireChatRequest(100)).toBeNull();
  const other = acquireChatRequest(101)!;
  first();
  first();
  const next = acquireChatRequest(100)!;
  expect(next).toBeTypeOf('function');
  expect(acquireChatRequest(100)).toBeNull();
  second();
  other();
  next();
});

it('limits request starts and permits a fresh minute', () => {
  for (let i = 0; i < CHAT_LIMITS.requestsPerMinute; i++) {
    acquireChatRequest(102, 0)!();
  }
  expect(acquireChatRequest(102, 1)).toBeNull();
  const release = acquireChatRequest(102, 60_000);
  expect(release).toBeTypeOf('function');
  release!();
});

it('bounds simultaneous work across users', () => {
  const releases = Array.from(
    { length: CHAT_LIMITS.concurrentPerProcess },
    (_, i) => acquireChatRequest(200 + i)!
  );
  expect(acquireChatRequest(300)).toBeNull();
  releases.forEach((release) => release());
});
