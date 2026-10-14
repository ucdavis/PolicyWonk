'use client';

import React from 'react';

import WonkyErrorBoundary from '../../../lib/error/wonkyErrorBoundary';
import { useShareUrl } from '../../../lib/hooks/useShareUrl';
import CopyToClipboardButton from '../../ui/copyToClipboardButton';

import { RegenerateShareButton, UnshareButton } from './shareButtons';
import { ShareModalLoadingStates } from './shareModal';

interface SharedUrlProps {
  shareId: string | undefined | null;
  group: string;
  isShared: boolean;
  handleRegenShare: () => void;
  handleUnshare: () => void;
  handleCopyShareUrl: () => void;
  isLoading: ShareModalLoadingStates;
}

const SharedUrl: React.FC<SharedUrlProps> = ({
  shareId,
  group,
  isShared,
  handleRegenShare,
  handleUnshare,
  handleCopyShareUrl,
  isLoading,
}) => {
  const url = useShareUrl(shareId, group);

  if (!isShared) {
    return null;
  }

  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
      <input
        className='input w-full border-main-border bg-base-100 text-sm'
        value={url}
        readOnly={true}
      />
      <div className='flex shrink-0 gap-1'>
        <WonkyErrorBoundary>
          <CopyToClipboardButton
            value={url}
            id='gtag-copy-share-url'
            onClick={handleCopyShareUrl}
          />
        </WonkyErrorBoundary>
        <WonkyErrorBoundary>
          <RegenerateShareButton
            handleShare={handleRegenShare}
            loadingState={isLoading}
          />
        </WonkyErrorBoundary>
        <WonkyErrorBoundary>
          <UnshareButton
            handleUnshare={handleUnshare}
            loadingState={isLoading}
          />
        </WonkyErrorBoundary>
      </div>
    </div>
  );
};

export default SharedUrl;
