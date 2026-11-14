/* eslint-disable no-console -- Tests inspect and break the structured log sink. */
import {
  CallbackRouteError,
  InvalidCheck,
  OAuthCallbackError,
} from '@auth/core/errors';
import type { NextAuthConfig } from 'next-auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  config: undefined as NextAuthConfig | undefined,
  ensureUserExists: vi.fn(),
  setCurrentGroup: vi.fn(),
  isDevAuthBypassEnabled: vi.fn(() => false),
}));
vi.mock('next-auth', () => ({
  default: (config: NextAuthConfig) => {
    mocks.config = config;
    return { handlers: { GET: vi.fn(), POST: vi.fn() } };
  },
}));
vi.mock('./services/userService', () => ({
  ensureUserExists: mocks.ensureUserExists,
}));
vi.mock('./lib/cookies', () => ({ setCurrentGroup: mocks.setCurrentGroup }));
vi.mock('./lib/devAuthBypass', () => ({
  DEV_AUTH_BYPASS_PROVIDER_ID: 'dev-bypass',
  getDevAuthBypassProvider: () => null,
  getDevAuthGroup: () => 'ucdavis',
  isDevAuthBypassEnabled: mocks.isDevAuthBypassEnabled,
}));

import './auth';

const claims = {
  name: 'urn:oid:2.16.840.1.113730.3.1.241',
  eppn: 'urn:oid:1.3.6.1.4.1.5923.1.1.1.6',
  email: 'urn:oid:0.9.2342.19200300.100.1.3',
  affiliation: 'urn:oid:1.3.6.1.4.1.5923.1.1.1.9',
};
const privateValues = {
  name: 'PRIVATE_DISPLAY_NAME',
  email: 'PRIVATE_EMAIL@example.invalid',
  eppn: 'PRIVATE_ID@example.invalid',
  token: 'PRIVATE_TOKEN',
  error: 'PRIVATE_DATABASE_CONNECTION_STRING',
};
const user = { id: 71, name: privateValues.name, email: privateValues.email };
const token = { sub: 'PRIVATE_SUBJECT', accessToken: privateValues.token };
const profile = () => ({
  requested: { tenant: 'lbl' },
  raw: {
    [claims.name]: privateValues.name,
    [claims.eppn]: privateValues.eppn,
    [claims.email]: privateValues.email,
    [claims.affiliation]: ['staff@lbl.gov'],
  } as Record<string, unknown>,
});
type JwtCallback = NonNullable<NonNullable<NextAuthConfig['callbacks']>['jwt']>;
const run = (overrides: Record<string, unknown> = {}) =>
  mocks.config!.callbacks!.jwt!({
    trigger: 'signIn',
    account: {
      provider: 'boxyhq-saml',
      type: 'oauth',
      providerAccountId: 'PRIVATE_PROVIDER_ACCOUNT',
    },
    profile: profile(),
    token,
    user: { ...user, id: String(user.id) },
    ...overrides,
  } as Parameters<JwtCallback>[0]);
const records = () =>
  vi.mocked(console.log).mock.calls.map(([line]) => JSON.parse(line as string));

beforeEach(() => {
  vi.restoreAllMocks();
  mocks.ensureUserExists.mockReset().mockResolvedValue(user);
  mocks.setCurrentGroup.mockReset().mockResolvedValue(undefined);
  mocks.isDevAuthBypassEnabled.mockReturnValue(false);
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('PolicyWonk SAML sign-in diagnostics', () => {
  it('logs callback completion and preserves user, group and token behavior', async () => {
    const result = await run();
    expect(result).toEqual({
      ...token,
      name: user.name,
      email: user.email,
      userId: user.id,
    });
    expect(mocks.ensureUserExists).toHaveBeenCalledExactlyOnceWith({
      name: privateValues.name,
      email: privateValues.email,
      upn: privateValues.eppn,
      affiliations: 'staff@lbl.gov',
    });
    expect(mocks.setCurrentGroup).toHaveBeenCalledExactlyOnceWith('lbl');
    expect(records()).toHaveLength(1);
    expect(records()[0]).toMatchObject({
      event: 'policywonk_signin',
      schema_version: 1,
      campus: 'lbl',
      stage: 'jwt_callback',
      outcome: 'completed',
      resolved_group: 'lbl',
      has_eppn: true,
      has_email: true,
      has_affiliation: true,
    });
    expect(records()[0].correlation_id).toMatch(/^[a-f\d-]{36}$/);
    expect(Number.isFinite(Date.parse(records()[0].timestamp))).toBe(true);
    expect(records()[0].duration_ms).toBeGreaterThanOrEqual(0);
    for (const secret of [
      ...Object.values(privateValues),
      'staff@lbl.gov',
      'PRIVATE_SUBJECT',
    ]) {
      expect(JSON.stringify(records())).not.toContain(secret);
    }
  });

  it('preserves first-value array claims and maps Berkeley tenant to its app campus', async () => {
    const arrayProfile = profile();
    arrayProfile.requested.tenant = 'ucberkeley';
    arrayProfile.raw[claims.name] = [privateValues.name, 'PRIVATE_SECOND_NAME'];
    arrayProfile.raw[claims.email] = [
      privateValues.email,
      'PRIVATE_SECOND_EMAIL',
    ];
    arrayProfile.raw[claims.eppn] = [privateValues.eppn, 'PRIVATE_SECOND_EPPN'];
    arrayProfile.raw[claims.affiliation] = 'staff@berkeley.edu';
    await run({ profile: arrayProfile });
    expect(mocks.ensureUserExists).toHaveBeenCalledWith({
      name: privateValues.name,
      email: privateValues.email,
      upn: privateValues.eppn,
      affiliations: 'staff@berkeley.edu',
    });
    expect(records()[0]).toMatchObject({
      campus: 'ucb',
      resolved_group: 'ucb',
      outcome: 'completed',
    });
  });

  it('records missing ePPN without changing the thrown error', async () => {
    const missing = profile();
    delete missing.raw[claims.eppn];
    const error = new Error('UPN is required');
    mocks.ensureUserExists.mockRejectedValue(error);
    await expect(run({ profile: missing })).rejects.toBe(error);
    expect(records()).toHaveLength(1);
    expect(records()[0]).toMatchObject({
      stage: 'user_upsert',
      outcome: 'failed',
      reason: 'missing_eppn',
      has_eppn: false,
      has_email: true,
      has_affiliation: true,
      resolved_group: null,
    });
    expect(mocks.setCurrentGroup).not.toHaveBeenCalled();
  });

  it('reports database failure and suppresses Auth.js wrapping the same error', async () => {
    const error = new Error(privateValues.error);
    mocks.ensureUserExists.mockRejectedValue(error);
    await expect(run()).rejects.toBe(error);
    mocks.config!.logger!.error!(
      new CallbackRouteError('callback failed', {
        cause: { err: error, provider: 'boxyhq-saml' },
      })
    );
    expect(records()).toHaveLength(1);
    expect(records()[0]).toMatchObject({
      stage: 'user_upsert',
      reason: 'user_upsert_failed',
      outcome: 'failed',
    });
    expect(JSON.stringify(records())).not.toContain(privateValues.error);
  });

  it('records a cookie/group failure with the resolved group and preserves the error', async () => {
    const error = new Error('PRIVATE_COOKIE_CONTENTS');
    mocks.setCurrentGroup.mockRejectedValue(error);
    await expect(run()).rejects.toBe(error);
    expect(records()[0]).toMatchObject({
      stage: 'group_assignment',
      reason: 'group_assignment_failed',
      outcome: 'failed',
      resolved_group: 'lbl',
    });
    expect(JSON.stringify(records())).not.toContain('PRIVATE_COOKIE_CONTENTS');
  });

  it('leaves malformed affiliation handling unchanged and records its failed stage', async () => {
    const malformed = profile();
    malformed.raw[claims.affiliation] = [42];
    await expect(run({ profile: malformed })).rejects.toBeInstanceOf(TypeError);
    expect(mocks.ensureUserExists).toHaveBeenCalledWith(
      expect.objectContaining({ affiliations: '42' })
    );
    expect(records()[0]).toMatchObject({
      outcome: 'failed',
      stage: 'group_assignment',
      reason: 'group_assignment_failed',
      has_affiliation: true,
      resolved_group: null,
    });
  });

  it('records claim extraction failure without pretending claims were inspected', async () => {
    const error = new Error('PRIVATE_CLAIM_ERROR');
    const malformed = profile();
    malformed.raw[claims.affiliation] = [
      {
        toString() {
          throw error;
        },
      },
    ];
    await expect(run({ profile: malformed })).rejects.toBe(error);
    expect(records()[0]).toMatchObject({
      outcome: 'failed',
      stage: 'claims',
      reason: 'claims_processing_failed',
      has_eppn: null,
      has_email: null,
      has_affiliation: null,
    });
    expect(JSON.stringify(records())).not.toContain('PRIVATE_CLAIM_ERROR');
  });

  it.each([
    undefined,
    'PRIVATE_TENANT\nINJECTED_LOG',
    '__proto__',
    'constructor',
  ])('allowlists requested campuses: %s', async (tenant) => {
    const unknown = { ...profile(), requested: { tenant } };
    delete unknown.raw[claims.affiliation];
    await run({ profile: unknown });
    expect(mocks.setCurrentGroup).toHaveBeenCalledExactlyOnceWith('ucdavis');
    expect(records()[0]).toMatchObject({
      campus: 'unknown',
      resolved_group: 'ucdavis',
      has_affiliation: false,
    });
    expect(JSON.stringify(records())).not.toContain('PRIVATE_TENANT');
  });

  it('does not let the requested-tenant getter break authentication', async () => {
    const hostile = {
      ...profile(),
      get requested() {
        throw new Error('PRIVATE_GETTER');
      },
    };
    await expect(run({ profile: hostile })).resolves.toMatchObject({
      userId: user.id,
    });
    expect(records()[0].campus).toBe('unknown');
  });

  it('isolates simultaneous callbacks and their failure categories', async () => {
    const error = new Error('PRIVATE_CONCURRENT_ERROR');
    mocks.ensureUserExists.mockImplementation(async (value) => {
      await Promise.resolve();
      if (value.affiliations === 'staff@berkeley.edu') {
        throw error;
      }
      return user;
    });
    const other = profile();
    other.requested.tenant = 'ucberkeley';
    other.raw[claims.affiliation] = ['staff@berkeley.edu'];
    const results = await Promise.allSettled([run(), run({ profile: other })]);
    expect(results.map((result) => result.status)).toEqual([
      'fulfilled',
      'rejected',
    ]);
    expect(new Set(records().map((record) => record.correlation_id)).size).toBe(
      2
    );
    expect(records().find((record) => record.campus === 'lbl').outcome).toBe(
      'completed'
    );
    expect(records().find((record) => record.campus === 'ucb').reason).toBe(
      'user_upsert_failed'
    );
  });

  it('preserves both success and the original failure when the sink throws', async () => {
    vi.mocked(console.log).mockImplementation(() => {
      throw new Error('sink unavailable');
    });
    await expect(run()).resolves.toEqual({
      ...token,
      name: user.name,
      email: user.email,
      userId: user.id,
    });
    const error = new Error('original database failure');
    mocks.ensureUserExists.mockRejectedValue(error);
    await expect(run()).rejects.toBe(error);
  });

  it('does not count JWT refreshes, other providers, or development bypass as SAML sign-ins', async () => {
    await expect(run({ trigger: undefined })).resolves.toBe(token);
    await expect(run({ account: { provider: 'other' } })).resolves.toBe(token);
    mocks.isDevAuthBypassEnabled.mockReturnValue(true);
    await expect(
      run({ account: { provider: 'dev-bypass' }, user: { ...user, id: '71' } })
    ).resolves.toEqual({
      ...token,
      name: user.name,
      email: user.email,
      userId: 71,
    });
    expect(records()).toEqual([]);
    expect(mocks.ensureUserExists).not.toHaveBeenCalled();
  });
});

describe('Auth.js diagnostics before the application callback', () => {
  it.each([
    [
      new OAuthCallbackError('PRIVATE_OAUTH_RESPONSE', {
        cause: { token: privateValues.token },
      }),
      'oauth_callback_failed',
    ],
    [new InvalidCheck('PRIVATE_STATE_COOKIE'), 'oauth_check_failed'],
    [
      new CallbackRouteError('callback failed', {
        cause: { err: new Error(privateValues.error) },
      }),
      'callback_failed',
    ],
    [
      Object.assign(new Error(privateValues.error), {
        type: 'PRIVATE_ERROR_TYPE',
      }),
      'auth_error',
    ],
  ])('emits only a bounded error category', (error, reason) => {
    mocks.config!.logger!.error!(error as Error);
    expect(records()).toHaveLength(1);
    expect(records()[0]).toMatchObject({
      event: 'auth_error',
      stage: 'auth_framework',
      reason,
    });
    expect(JSON.stringify(records())).not.toContain('PRIVATE_');
  });

  it('does not suppress an unrelated error after an application callback failure', async () => {
    mocks.ensureUserExists.mockRejectedValue(new Error('PRIVATE_DB_FAILURE'));
    await expect(run()).rejects.toThrow();
    mocks.config!.logger!.error!(new InvalidCheck('PRIVATE_COOKIE'));
    expect(records().map((record) => record.event)).toEqual([
      'policywonk_signin',
      'auth_error',
    ]);
  });

  it('keeps warnings bounded and discards raw debug metadata', () => {
    mocks.config!.logger!.warn!('PRIVATE_WARNING' as never);
    mocks.config!.logger!.debug!('PRIVATE_MESSAGE', {
      profile: profile(),
      token: privateValues.token,
    });
    expect(records()).toHaveLength(1);
    expect(records()[0]).toMatchObject({
      event: 'auth_warning',
      reason: 'configuration_warning',
    });
    expect(JSON.stringify(records())).not.toContain('PRIVATE_');
  });

  it('does not throw for a hostile error or unavailable logging sink', () => {
    const error = new Error('PRIVATE_ERROR');
    Object.defineProperty(error, 'cause', {
      get() {
        throw new Error('PRIVATE_GETTER');
      },
    });
    expect(() => mocks.config!.logger!.error!(error)).not.toThrow();
    vi.mocked(console.log).mockImplementation(() => {
      throw new Error('sink unavailable');
    });
    expect(() =>
      mocks.config!.logger!.error!(new InvalidCheck('PRIVATE_COOKIE'))
    ).not.toThrow();
    expect(() =>
      mocks.config!.logger!.warn!('PRIVATE_WARNING' as never)
    ).not.toThrow();
  });
});
