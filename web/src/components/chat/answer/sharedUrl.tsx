'use client';

import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { InputGroup, Input } from 'reactstrap';

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
          </InputGroup>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SharedUrl;
