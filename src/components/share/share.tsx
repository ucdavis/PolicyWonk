'use client';
import React from 'react';

import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import { faPaperPlane as faPaperPlaneSolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import AnimatedButton from '../ui/animatedButton';

import ShareModal from './shareModal';

interface ShareProps {
  chatId: string;
  shareId: string | undefined;
}

const Share: React.FC<ShareProps> = ({ chatId, shareId }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [url, setUrl] = React.useState<string>('');

  React.useEffect(() => {
    // since window doesn't exist on the server, initialize this on first mount
    setUrl(shareId ? `${window.location.origin}/share/${shareId}` : '');
  }, [shareId]);
  return (
    <>
      <AnimatedButton
        displayBeforeClick={<FontAwesomeIcon icon={faPaperPlane} />}
        displayOnClick={<FontAwesomeIcon icon={faPaperPlaneSolid} />}
        onClick={() => setIsOpen(true)}
        selected={!!shareId}
      />
      <ShareModal
        isOpen={isOpen}
        toggle={setIsOpen}
        chatId={chatId}
        shareId={shareId}
        url={url}
      />
    </>
  );
};

export default Share;
