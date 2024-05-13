'use client';

import React from 'react';

export const useShareUrl = (shareId: string | undefined) => {
  const [url, setUrl] = React.useState('');

  React.useEffect(() => {
    if (!shareId) {
      setUrl('');
      return;
    }

    // since window doesn't exist on the server, initialize this on first mount + on shareId change
    const newUrl = shareId ? `${window.location.origin}/share/${shareId}` : '';
    setUrl(newUrl);
  }, [shareId]);

  return url;
};
