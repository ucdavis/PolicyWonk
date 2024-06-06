'use client';
import React from 'react';

import { faRotateRight, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import { Button } from 'reactstrap';

import AnimatedButton from '@/components/ui/animatedButton';
import { IconVariants, IconVariantOptions } from '@/models/animations';
import { GTagEvents } from '@/models/gtag';

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
  const isLoading = loadingState === GTagEvents.UNSHARE;
  return (
    <AnimatedButton
      displayBeforeClick={
        <motion.div
          variants={IconVariants}
          initial={false}
          animate={
            isLoading
              ? IconVariantOptions.bounce
              : IconVariantOptions.bounceStop
          }
        >
          <FontAwesomeIcon icon={faTrash} />
        </motion.div>
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
  const isLoading = loadingState === GTagEvents.REGEN_SHARE;
  return (
    <AnimatedButton
      displayBeforeClick={
        <motion.div
          variants={IconVariants}
          initial={false}
          animate={
            isLoading
              ? IconVariantOptions.rotate
              : IconVariantOptions.rotateStop
          }
        >
          <FontAwesomeIcon icon={faRotateRight} />
        </motion.div>
      }
      onClick={handleShare}
      title={'Regenerate share link'}
      disabled={loadingState !== ''}
    />
  );
};
