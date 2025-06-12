// File: /workspace/web/src/lib/cookies.ts
import { cookies } from 'next/headers';

import { isValidGroupFormat } from './groups';

/**
 * Sets the current group for the user
 * @param groupId The group ID to set as the current group
 */
export function setCurrentGroup(groupId: string) {
  if (isValidGroupFormat(groupId) === false) {
    throw new Error(`Invalid group format: ${groupId}`);
  }

  cookies().set({
    name: 'pw.group',
    value: groupId,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

/**
 * Gets the current group from the cookie
 * @returns The current group ID or 'default' if not set
 */
export function getCurrentGroup(): string {
  const groupCookie = cookies().get('pw.group');

  const validGroup =
    groupCookie?.value && isValidGroupFormat(groupCookie.value);

  if (validGroup) {
    return groupCookie.value;
  }

  return 'ucdavis'; // Default group if cookie is not set or invalid
}
