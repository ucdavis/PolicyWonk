'use client';
import React from 'react';

import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import { faPaperPlane as faPaperPlaneSolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { usePathname } from 'next/navigation';

import AnimatedButton from '../ui/animatedButton';

interface ShareButtonProps {
  chatId: string;
  shareId: string;
  onShare: (chatId: string) => void;
}

const ShareButtons: React.FC<ShareButtonProps> = ({
  chatId,
  shareId,
  onShare,
}) => {
  return (
    <AnimatedButton
      displayBeforeClick={<FontAwesomeIcon icon={faPaperPlane} />}
      displayOnClick={<FontAwesomeIcon icon={faPaperPlaneSolid} />}
      onClick={() => onShare(chatId)}
    />
  );
};

export default ShareButtons;
