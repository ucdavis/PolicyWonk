'use client';

/**
 * Client-side function to update the user's current group
 * @param groupId The group ID to set as the current group
 * @returns Promise that resolves when the group has been updated
 */
export async function updateCurrentGroup(groupId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/group', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ groupId }),
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Reloads the page to reflect the new group setting
 * Call this after updateCurrentGroup to see the changes
 */
export function reloadWithNewGroup(): void {
  window.location.reload();
}
