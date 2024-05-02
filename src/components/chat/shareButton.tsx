'use client';
import React from 'react';

import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import { faPaperPlane as faPaperPlaneSolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import AnimatedButton from '../ui/animatedButton';

import ShareModal from './shareModal';

interface ShareButtonProps {
  chatId: string;
  shareId: string;
  onShare: (chatId: string) => void;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  chatId,
  shareId,
  onShare,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const onClick = () => {
    setIsOpen(true);
    onShare(chatId);
  };

  return (
    <>
      <AnimatedButton
        displayBeforeClick={<FontAwesomeIcon icon={faPaperPlane} />}
        displayOnClick={<FontAwesomeIcon icon={faPaperPlaneSolid} />}
        onClick={() => onClick()}
      />
      <ShareModal isOpen={isOpen} setIsOpen={setIsOpen} shareId={shareId} />
    </>
  );
};

export default ShareButton;
