import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { expect, it, vi } from 'vitest';

vi.mock('./auth', () => ({ auth: (handler: unknown) => handler }));

import proxy, { config } from './proxy';

const run = (auth: unknown, path = '/ucdavis/chat/new') =>
  (proxy as unknown as (req: unknown) => Response | undefined)({
    auth,
    nextUrl: new URL(path, 'https://example.org'),
  });

it.each([
  null,
  {},
  { message: 'configuration error' },
  { user: {} },
  { userId: 1 },
  { user: {}, userId: '1' },
  { user: {}, userId: -1 },
  { user: {}, userId: 1.5 },
  { user: {}, userId: 1, error: 'invalid' },
])('redirects an invalid application session: %j', (session) => {
  const response = run(session);
  expect(response?.status).toBe(302);
  expect(response?.headers.get('location')).toContain(
    '/auth/login?callbackUrl='
  );
});

it('accepts a real application session and permits the login route', () => {
  expect(run({ userId: 1, user: { name: 'Test' } })).toBeUndefined();
  expect(run(null, '/auth/login')).toBeUndefined();
});

it('lets chat enforce upload deadlines without proxy body buffering', () => {
  expect(unstable_doesMiddlewareMatch({ config, url: '/api/chat' })).toBe(
    false
  );
});

it.each([
  '/ucdavis/chat/new',
  '/api/history',
  '/api/unions',
  '/api/chat/completions',
  '/api/chat.json',
  '/trpc/chat',
])('retains proxy authentication for %s', (url) => {
  expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true);
});
