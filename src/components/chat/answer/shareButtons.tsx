'use client';
import React from 'react';

import { faRotateRight, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Button } from 'reactstrap';

import AnimatedButton from '@/components/ui/animatedButton';
import {
  AnimatedBounceIcon,
  AnimatedRotateIcon,
} from '@/components/ui/animatedIcons';

import { ShareModalLoadingStates } from './shareModal';

interface ShareButtonProps {
  handleShare: () => void;
  loadingState: ShareModalLoadingStates;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  handleShare,
  loadingState,
}) => {
  const isLoading = loadingState === 'share';
  return (
    <Button
      color='primary'
      onClick={handleShare}
      disabled={loadingState !== ''}
    >
      {isLoading ? 'Sharing...' : 'Share'}
    </Button>
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
  const isLoading = loadingState === 'unshare';
  return (
    <AnimatedButton
      displayBeforeClick={
        <AnimatedBounceIcon isAnimating={isLoading} icon={faTrash} />
      }
      onClick={handleUnshare}
      title={'Delete share link'}
      disabled={loadingState !== ''}
    />
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
  const isLoading = loadingState === 'regen';
  return (
    <AnimatedButton
      displayBeforeClick={
        <AnimatedRotateIcon isAnimating={isLoading} icon={faRotateRight} />
      }
      onClick={handleShare}
      title={'Regenerate share link'}
      disabled={loadingState !== ''}
    />
  );
};
