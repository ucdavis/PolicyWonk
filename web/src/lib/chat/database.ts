import type { Prisma } from '@prisma/client';

import prisma from '@/lib/db';

export async function withChatDatabase<T>(
  operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  signal?.throwIfAborted();
  return prisma.$transaction(
    async (transaction) => {
      await transaction.$executeRaw`SET LOCAL statement_timeout = '10s'`;
      signal?.throwIfAborted();
      const result = await operation(transaction);
      signal?.throwIfAborted();
      return result;
    },
    { maxWait: 2_000, timeout: 15_000 }
  );
}
