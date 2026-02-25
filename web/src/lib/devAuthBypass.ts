import type { Provider } from 'next-auth/providers';
import Credentials from 'next-auth/providers/credentials';

import prisma from './db';

export const DEV_AUTH_BYPASS_PROVIDER_ID = 'dev-bypass';

const truthyValues = new Set(['1', 'true', 'yes']);

const isTruthyEnvValue = (value: string | undefined) => {
  if (!value) {
    return false;
  }

  return truthyValues.has(value.toLowerCase());
};

const parsePositiveInteger = (value: string) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

export const isDevAuthBypassEnabled = () =>
  process.env.NODE_ENV !== 'production' &&
  isTruthyEnvValue(process.env.DEV_AUTH_BYPASS);

export const getDevAuthUserId = () => process.env.DEV_AUTH_USER_ID ?? '1';

export const getDevAuthGroup = () => process.env.DEV_AUTH_GROUP ?? 'ucdavis';

export const getDevAuthBypassProvider = (): Provider | null => {
  if (!isDevAuthBypassEnabled()) {
    return null;
  }

  return Credentials({
    id: DEV_AUTH_BYPASS_PROVIDER_ID,
    name: 'Dev Bypass',
    credentials: {
      userId: { label: 'User ID', type: 'text' },
    },
    async authorize(credentials) {
      const userIdRaw =
        (credentials?.userId as string | undefined) ?? getDevAuthUserId();
      const userId = parsePositiveInteger(userIdRaw);

      if (!userId) {
        return null;
      }

      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        return null;
      }

      return {
        id: String(user.id),
        name: user.name || `User ${user.id}`,
        email: user.email || undefined,
      };
    },
  });
};
