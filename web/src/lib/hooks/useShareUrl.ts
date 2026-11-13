'use client';

import React from 'react';

const subscribe = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => '';

export const useShareUrl = (
  shareId: string | undefined | null,
  group: string
) => {
  const origin = React.useSyncExternalStore(
    subscribe,
    getOrigin,
    getServerOrigin
  );
  return origin && shareId && group
    ? `${origin}/${group}/share/${shareId}`
    : '';
};
