'use client';
import React from 'react';

import { faRotateRight, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import { Button } from 'reactstrap';

import AnimatedButton from '@/components/ui/animatedButton';

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
        <motion.div
          variants={{
            bounce: {
              y: [0, -10, 0],
              scale: 1,
              transition: {
                duration: 0.75,
                repeat: Infinity,
                stiffness: 90,
                damping: 5,
              },
            },
            none: { y: 0, transition: { repeat: 0 } },
          }}
          animate={isLoading ? 'bounce' : 'none'}
          initial={false}
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
  const isLoading = loadingState === 'regen';
  return (
    <AnimatedButton
      displayBeforeClick={
        <motion.div // rotate icon when we start regenerating link
          variants={{
            rotate: {
              rotate: [0, 360],
              transition: {
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              },
            },
            none: { rotate: 360, transition: { repeat: 0, duration: 1 } },
          }}
          initial={false}
          animate={isLoading ? 'rotate' : 'none'}
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
