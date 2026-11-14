import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { inspect } from 'node:util';

import { NextRequest } from 'next/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const { ensureUserExists, setCurrentGroup } = vi.hoisted(() => ({
  ensureUserExists: vi.fn(),
  setCurrentGroup: vi.fn(),
}));
vi.mock('./services/userService', () => ({ ensureUserExists }));
vi.mock('./lib/cookies', () => ({ setCurrentGroup }));
vi.mock('./lib/devAuthBypass', () => ({
  DEV_AUTH_BYPASS_PROVIDER_ID: 'dev-bypass',
  getDevAuthBypassProvider: () => null,
  getDevAuthGroup: () => 'ucdavis',
  isDevAuthBypassEnabled: () => false,
}));

const appOrigin = 'http://policywonk.example.invalid';
const claims = {
  name: 'urn:oid:2.16.840.1.113730.3.1.241',
  upn: 'urn:oid:1.3.6.1.4.1.5923.1.1.1.6',
  email: 'urn:oid:0.9.2342.19200300.100.1.3',
  affiliation: 'urn:oid:1.3.6.1.4.1.5923.1.1.1.9',
};
const privateValues = {
  name: 'PRIVATE_HTTP_NAME',
  upn: 'PRIVATE_HTTP_UPN@example.invalid',
  email: 'PRIVATE_HTTP_EMAIL@example.invalid',
  id: 'PRIVATE_HTTP_PROFILE_ID',
  token: 'PRIVATE_HTTP_ACCESS_TOKEN',
  code: 'PRIVATE_HTTP_AUTHORIZATION_CODE',
  error: 'PRIVATE_HTTP_ERROR_DESCRIPTION',
};

let server: Server;
let issuer: string;
let profile: Record<string, unknown>;
let tokenError: boolean;
let requests: string[];
let logs: unknown[][];
let handlers: Pick<typeof import('./auth'), 'GET' | 'POST'>;
let cookies: Map<string, string>;
let transientSecrets: Set<string>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  logs = [];
  for (const method of ['log', 'info', 'warn', 'error'] as const) {
    vi.spyOn(console, method).mockImplementation((...args) => logs.push(args));
  }
  requests = [];
  cookies = new Map();
  transientSecrets = new Set();
  tokenError = false;
  profile = {
    id: privateValues.id,
    email: privateValues.email,
    firstName: privateValues.name,
    requested: { tenant: 'lbl', product: 'policywonk' },
    raw: {
      [claims.name]: privateValues.name,
      [claims.upn]: privateValues.upn,
      [claims.email]: privateValues.email,
      [claims.affiliation]: ['staff@lbl.gov'],
    },
  };
  ensureUserExists.mockImplementation(async (user) => {
    if (!user.upn) {
      throw new Error('UPN is required');
    }
    return { ...user, id: 71 };
  });
  setCurrentGroup.mockResolvedValue(undefined);
  server = createServer(async (request, response) => {
    requests.push(request.url!);
    // Consume the request body without logging authorization codes or credentials.
    for await (const chunk of request) {
      void chunk;
    }
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/api/oauth/token') {
      response.statusCode = tokenError ? 400 : 200;
      response.end(
        JSON.stringify(
          tokenError
            ? { error: 'invalid_grant', error_description: privateValues.error }
            : { access_token: privateValues.token, token_type: 'Bearer' }
        )
      );
    } else if (request.url === '/api/oauth/userinfo') {
      response.end(JSON.stringify(profile));
    } else {
      response.statusCode = 404;
      response.end('{}');
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  issuer = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  vi.stubEnv('SSO_ISSUER_URL', issuer);
  vi.stubEnv('AUTH_SECRET', 'disposable-http-test-secret-with-enough-entropy');
  vi.stubEnv('AUTH_TRUST_HOST', 'true');
  vi.stubEnv('AUTH_URL', undefined);
  vi.stubEnv('NEXTAUTH_URL', undefined);
  handlers = await import('./auth');
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

async function request(path: string, body?: URLSearchParams) {
  const req = new NextRequest(appOrigin + path, {
    method: body ? 'POST' : 'GET',
    headers: { cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; ') },
    body,
  });
  const response = await (body ? handlers.POST(req) : handlers.GET(req));
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(';')[0];
    const separator = pair.indexOf('=');
    const name = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    if (value) {
      cookies.set(name, value);
      transientSecrets.add(value);
      for (const part of decodeURIComponent(value).split('|')) {
        transientSecrets.add(part);
      }
    } else {
      cookies.delete(name);
    }
  }
  return response;
}

async function startSignIn() {
  const csrf = await request('/api/auth/csrf');
  expect(csrf.status, inspect(logs, { depth: 5 })).toBe(200);
  const { csrfToken } = await csrf.json();
  const response = await request(
    '/api/auth/signin/boxyhq-saml?tenant=lbl&product=policywonk',
    new URLSearchParams({ csrfToken, callbackUrl: `${appOrigin}/lbl` })
  );
  expect(response.status).toBe(302);
  const redirect = new URL(response.headers.get('location')!);
  expect(redirect.origin).toBe(issuer);
  expect(redirect.pathname).toBe('/api/oauth/authorize');
  expect(redirect.searchParams.get('tenant')).toBe('lbl');
  expect(redirect.searchParams.get('state')).toBeTruthy();
  const state = redirect.searchParams.get('state')!;
  transientSecrets.add(state);
  return state;
}

function callback(state: string, extra: Record<string, string> = {}) {
  return request(
    '/api/auth/callback/boxyhq-saml?' +
      new URLSearchParams({ state, code: privateValues.code, ...extra })
  );
}

function events() {
  return logs.flatMap((args) => {
    try {
      const parsed = JSON.parse(String(args[0]));
      return parsed.event ? [parsed] : [];
    } catch {
      return [];
    }
  });
}

function assertRedacted() {
  const output = inspect(logs, { depth: 20 });
  for (const value of Object.values(privateValues)) {
    expect(output).not.toContain(value);
  }
  for (const secret of transientSecrets) {
    expect(output).not.toContain(secret);
  }
  expect(output).not.toContain('staff@lbl.gov');
}

it('completes the real Auth.js OAuth flow, emits one outcome and serves the session', async () => {
  const state = await startSignIn();
  const response = await callback(state);
  expect(response.status).toBe(302);
  expect(response.headers.get('location')).toBe(`${appOrigin}/lbl`);
  expect(requests).toEqual(['/api/oauth/token', '/api/oauth/userinfo']);
  expect(setCurrentGroup).toHaveBeenCalledWith('lbl');
  const records = events().filter(
    (event) => event.event === 'policywonk_signin'
  );
  expect(records).toHaveLength(1);
  expect(records[0]).toMatchObject({
    campus: 'lbl',
    stage: 'jwt_callback',
    outcome: 'completed',
    has_eppn: true,
    has_email: true,
    has_affiliation: true,
    resolved_group: 'lbl',
  });
  const session = await request('/api/auth/session');
  expect(session.status).toBe(200);
  expect(await session.json()).toMatchObject({ userId: 71 });
  expect(
    events().filter((event) => event.event === 'policywonk_signin')
  ).toHaveLength(1);
  assertRedacted();
});

it.each(['missing_upn', 'database', 'group'] as const)(
  'denies the session on %s failure without duplicate error events or raw values',
  async (failure) => {
    if (failure === 'missing_upn') {
      delete (profile.raw as Record<string, unknown>)[claims.upn];
    } else if (failure === 'database') {
      ensureUserExists.mockRejectedValue(new Error(privateValues.error));
    } else {
      setCurrentGroup.mockRejectedValue(new Error(privateValues.error));
    }
    const state = await startSignIn();
    const response = await callback(state);
    expect(response.status).toBe(302);
    expect(new URL(response.headers.get('location')!).pathname).toBe(
      '/api/auth/error'
    );
    expect(
      events().filter((event) => event.event === 'policywonk_signin')
    ).toHaveLength(1);
    expect(
      events().filter((event) => event.event === 'auth_error')
    ).toHaveLength(0);
    expect(
      events().find((event) => event.event === 'policywonk_signin')
    ).toMatchObject({
      outcome: 'failed',
      stage: failure === 'group' ? 'group_assignment' : 'user_upsert',
      reason: {
        missing_upn: 'missing_eppn',
        database: 'user_upsert_failed',
        group: 'group_assignment_failed',
      }[failure],
    });
    const session = await request('/api/auth/session');
    expect(await session.json()).toBeNull();
    assertRedacted();
  }
);

it.each(['state', 'token', 'provider'] as const)(
  'records a sanitized %s failure before the application callback',
  async (failure) => {
    const state = await startSignIn();
    tokenError = failure === 'token';
    const response = await callback(
      failure === 'state' ? 'unrelated-state' : state,
      failure === 'provider'
        ? { error: 'access_denied', error_description: privateValues.error }
        : {}
    );
    expect(response.status).toBe(302);
    expect(new URL(response.headers.get('location')!).pathname).toBe(
      failure === 'provider' ? '/api/auth/signin' : '/api/auth/error'
    );
    expect(ensureUserExists).not.toHaveBeenCalled();
    expect(
      events().filter((event) => event.event === 'auth_error')
    ).toHaveLength(1);
    expect(
      events().filter((event) => event.event === 'policywonk_signin')
    ).toHaveLength(0);
    expect(
      events().find((event) => event.event === 'auth_error')
    ).toMatchObject({
      stage: 'auth_framework',
      reason:
        failure === 'provider' ? 'oauth_callback_failed' : 'callback_failed',
    });
    assertRedacted();
  }
);

it.each(['success', 'database'] as const)(
  'preserves the HTTP %s outcome when the log sink throws',
  async (outcome) => {
    vi.spyOn(console, 'log').mockImplementation(() => {
      throw new Error('Synthetic log sink failure');
    });
    if (outcome === 'database') {
      ensureUserExists.mockRejectedValue(new Error(privateValues.error));
    }
    const response = await callback(await startSignIn());
    expect(response.status).toBe(302);
    expect(new URL(response.headers.get('location')!).pathname).toBe(
      outcome === 'success' ? '/lbl' : '/api/auth/error'
    );
    const session = await request('/api/auth/session');
    if (outcome === 'success') {
      expect(await session.json()).toMatchObject({ userId: 71 });
    } else {
      expect(await session.json()).toBeNull();
    }
  }
);
