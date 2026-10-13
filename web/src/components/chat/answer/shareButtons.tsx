'use client';
import React from 'react';

import { faRotateRight, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { GTagEvents } from '../../../models/gtag';

import { ShareModalLoadingStates } from './shareModal';

interface ShareButtonProps {
  handleShare: () => void;
  loadingState: ShareModalLoadingStates;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  handleShare,
  loadingState,
}) => {
  const isLoading = loadingState === GTagEvents.SHARE;
  return (
    <button
      type='button'
      className='btn btn-secondary w-full sm:w-auto'
      onClick={handleShare}
      disabled={loadingState !== ''}
    >
      {isLoading ? 'Sharing...' : 'Share'}
    </button>
  );
};

interface UnshareButtonProps {
  handleUnshare: () => void;
  loadingState: ShareModalLoadingStates;
}

export const UnshareButton: React.FC<UnshareButtonProps> = ({
  handleUnshare,
  loadingState,
}) => {
  return (
    <button
      type='button'
      className='btn btn-ghost btn-sm btn-square mr-1 text-base-content/60 hover:text-primary'
      onClick={handleUnshare}
      title={'Delete share link'}
      disabled={loadingState !== ''}
    >
      <FontAwesomeIcon icon={faTrash} />
    </button>
  );
};

interface RegenerateShareButtonProps {
  handleShare: () => void;
  loadingState: ShareModalLoadingStates;
}

export const RegenerateShareButton: React.FC<RegenerateShareButtonProps> = ({
  handleShare,
  loadingState,
}) => {
  return (
    <button
      type='button'
      className='btn btn-ghost btn-sm btn-square mr-1 text-base-content/60 hover:text-primary'
      onClick={handleShare}
      title={'Regenerate share link'}
      disabled={loadingState !== ''}
    >
      <FontAwesomeIcon icon={faRotateRight} />
    </button>
  );
};
