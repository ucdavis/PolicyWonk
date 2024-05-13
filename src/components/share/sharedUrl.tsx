'use client';
import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { InputGroup, Input } from 'reactstrap';

import { useShareUrl } from '@/lib/hooks/useShareUrl';

import CopyToClipboardButton from '../ui/copyToClipboardButton';

import { ShareModalLoadingStates } from './share';
import { RegenerateShareButton, UnshareButton } from './shareButtons';

interface SharedUrlProps {
  shareId: string | undefined;
  isShared: boolean;
  handleRegenShare: () => void;
  handleUnshare: () => void;
  isLoading: ShareModalLoadingStates;
}

const SharedUrl: React.FC<SharedUrlProps> = ({
  shareId,
  isShared,
  handleRegenShare,
  handleUnshare,
  isLoading,
}) => {
  const url = useShareUrl(shareId);

  return (
    <AnimatePresence mode='popLayout'>
      {isShared && (
        <motion.div // do not move this animation into a different component
          // or it will have to wait for a rerender to animate, making popLayout not work as expected
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 10,
            ease: 'easeIn',
          }}
        >
          <InputGroup>
            <Input
              className='custom-input-height'
              value={url}
              readOnly={true}
            />
            <div className='ms-2'>
              <CopyToClipboardButton value={url} id='share-copy-url' />
              <RegenerateShareButton
                handleShare={handleRegenShare}
                loadingState={isLoading}
              />
              <UnshareButton
                handleUnshare={handleUnshare}
                loadingState={isLoading}
              />
            </div>
          </InputGroup>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SharedUrl;
