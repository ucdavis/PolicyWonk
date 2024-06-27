'use client';
import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { InputGroup, Input } from 'reactstrap';

import CopyToClipboardButton from '@/components/ui/copyToClipboardButton';
import ErrorBoundary from '@/lib/error/errorBoundary';
import { useShareUrl } from '@/lib/hooks/useShareUrl';

import { RegenerateShareButton, UnshareButton } from './shareButtons';
import { ShareModalLoadingStates } from './shareModal';

interface SharedUrlProps {
  shareId: string | undefined;
  isShared: boolean;
  handleRegenShare: () => void;
  handleUnshare: () => void;
  handleCopyShareUrl: () => void;
  isLoading: ShareModalLoadingStates;
}

const SharedUrl: React.FC<SharedUrlProps> = ({
  shareId,
  isShared,
  handleRegenShare,
  handleUnshare,
  handleCopyShareUrl,
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
              <ErrorBoundary>
                <CopyToClipboardButton
                  value={url}
                  id='gtag-copy-share-url'
                  onClick={handleCopyShareUrl}
                />
              </ErrorBoundary>
              <ErrorBoundary>
                <RegenerateShareButton
                  handleShare={handleRegenShare}
                  loadingState={isLoading}
                />
              </ErrorBoundary>
              <ErrorBoundary>
                <UnshareButton
                  handleUnshare={handleUnshare}
                  loadingState={isLoading}
                />
              </ErrorBoundary>
            </div>
          </InputGroup>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SharedUrl;
