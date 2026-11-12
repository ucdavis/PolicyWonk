import type { WonkSession } from '@/models/session';

// Auth.js configuration failures must never count as an application session.
export const isApplicationSession = (
  session: unknown
): session is WonkSession => {
  if (!session || typeof session !== 'object') {
    return false;
  }
  const value = session as Partial<WonkSession>;
  return (
    !('error' in session) &&
    !('message' in session) &&
    !!value.user &&
    typeof value.user === 'object' &&
    Number.isSafeInteger(value.userId) &&
    (value.userId ?? 0) > 0
  );
};
