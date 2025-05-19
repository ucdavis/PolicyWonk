'use client';

import React from 'react';

export const useShareUrl = (
  shareId: string | undefined | null,
  group: string
) => {
  const [url, setUrl] = React.useState('');

  React.useEffect(() => {
    if (!shareId || !group) {
      setUrl('');
      return;
    }

    // since window doesn't exist on the server, initialize this on first mount + on shareId change
    const newUrl = shareId
      ? `${window.location.origin}/${group}/share/${shareId}`
      : '';
    setUrl(newUrl);
  }, [shareId, group]);

  return url;
};
