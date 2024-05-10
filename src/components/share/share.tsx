'use client';
import React from 'react';

import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import { faPaperPlane as faPaperPlaneSolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import AnimatedButton from '../ui/aButton';

import ShareModal from './shareModal';

interface ShareProps {
  chatId: string;
  shareId: string | undefined;
}

const Share: React.FC<ShareProps> = ({ chatId, shareId }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const isShared = shareId !== undefined;
  return (
    <>
      <AnimatedButton
        displayBeforeClick={
          <FontAwesomeIcon icon={isShared ? faPaperPlaneSolid : faPaperPlane} />
        }
        onClick={() => setIsOpen(true)}
        selected={isShared}
        title={'Share Chat'}
      />
      <ShareModal
        isOpen={isOpen}
        toggle={setIsOpen}
        chatId={chatId}
        shareId={shareId}
      />
    </>
  );
};

export default Share;
