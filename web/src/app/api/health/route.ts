import { Client } from '@elastic/elasticsearch';

import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Share an in-flight check and cache briefly so probes cannot exhaust the DB pool.
let cachedCheck: Promise<boolean> | undefined;
let checkedAt = 0;
let searchClient: Client | undefined;

async function checkDependencies(): Promise<boolean> {
  if (
    !process.env.DATABASE_URL ||
    !process.env.ELASTIC_URL ||
    !process.env.ELASTIC_INDEX ||
    !process.env.ELASTIC_SEARCHER_USERNAME ||
    !process.env.ELASTIC_SEARCHER_PASSWORD
  ) {
    return false;
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    searchClient ??= new Client({
      node: process.env.ELASTIC_URL,
      auth: {
        username: process.env.ELASTIC_SEARCHER_USERNAME,
        password: process.env.ELASTIC_SEARCHER_PASSWORD,
      },
      requestTimeout: 5000,
      maxRetries: 0,
    });
    await Promise.race([
      Promise.all([
        prisma.$queryRaw`SELECT 1`,
        // Exercise the app's index and read credentials, without writing data.
        searchClient.count({ index: process.env.ELASTIC_INDEX }),
      ]),
      new Promise((_, reject) => {
        timeout = globalThis.setTimeout(
          () => reject(new Error('Probe timed out')),
          6000
        );
      }),
    ]);
    return true;
  } catch {
    // Never expose connection strings, credentials, index names, or error bodies.
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  if (!cachedCheck || Date.now() - checkedAt >= 10000) {
    checkedAt = Date.now();
    cachedCheck = checkDependencies();
  }

  const healthy = await cachedCheck;
  return Response.json(
    {
      status: healthy ? 'healthy' : 'unhealthy',
      revision: process.env.BUILD_REVISION ?? 'unknown',
    },
    {
      status: healthy ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
