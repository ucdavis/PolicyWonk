import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { query, count } = vi.hoisted(() => ({
  query: vi.fn(),
  count: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ default: { $queryRaw: query } }));
vi.mock('@elastic/elasticsearch', () => ({
  Client: class {
    count = count;
  },
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  query.mockResolvedValue([{ value: 1 }]);
  count.mockResolvedValue({ count: 1 });
  for (const key of [
    'DATABASE_URL',
    'ELASTIC_URL',
    'ELASTIC_INDEX',
    'ELASTIC_SEARCHER_USERNAME',
    'ELASTIC_SEARCHER_PASSWORD',
  ]) {
    vi.stubEnv(key, 'test-only');
  }
  vi.stubEnv('BUILD_REVISION', 'a'.repeat(40));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('deployment health', () => {
  it('identifies the running revision after both dependencies respond', async () => {
    const { GET } = await import('./route');
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({
      status: 'healthy',
      revision: 'a'.repeat(40),
    });
    expect(query).toHaveBeenCalledOnce();
    expect(count).toHaveBeenCalledWith({ index: 'test-only' });
  });

  it.each(['database', 'search'])(
    'fails closed when %s fails',
    async (service) => {
      (service === 'database' ? query : count).mockRejectedValue(
        new Error('secret connection information')
      );
      const { GET } = await import('./route');
      const response = await GET();
      expect(response.status).toBe(503);
      expect(await response.text()).not.toContain('secret');
    }
  );

  it('rejects missing configuration without contacting dependencies', async () => {
    vi.stubEnv('ELASTIC_INDEX', '');
    const { GET } = await import('./route');
    expect((await GET()).status).toBe(503);
    expect(query).not.toHaveBeenCalled();
    expect(count).not.toHaveBeenCalled();
  });

  it('shares concurrent probes and refreshes after the cache expires', async () => {
    vi.useFakeTimers();
    const { GET } = await import('./route');
    await Promise.all([GET(), GET(), GET()]);
    expect(query).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(10001);
    await GET();
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('returns unavailable when a dependency hangs', async () => {
    vi.useFakeTimers();
    query.mockReturnValue(new Promise(() => {}));
    const { GET } = await import('./route');
    const result = GET();
    await vi.advanceTimersByTimeAsync(6001);
    expect((await result).status).toBe(503);
  });
});
