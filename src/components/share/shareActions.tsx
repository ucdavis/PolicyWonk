import React from 'react';

import { faTrash, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import AnimatedButton from '../ui/animatedButton';
import CopyToClipboardButton from '../ui/copyToClipboardButton';

interface ShareActionsProps {
  shareId: string;
}

const ShareActions: React.FC<ShareActionsProps> = ({ shareId }) => {
  const handleDeleteShare = () => {
    // delete share logic here
  };

  const handleRotateShare = () => {
    // rotate share logic here
  };

  const url = `${window.location.origin}/share/${shareId}`;

  return (
    <>
      <CopyToClipboardButton value={url} id='share-copy-url' />
      <AnimatedButton
        displayBeforeClick={<FontAwesomeIcon icon={faRotateRight} />}
        onClick={handleRotateShare}
        title={'Regenerate share link'}
      />
      <AnimatedButton
        displayBeforeClick={<FontAwesomeIcon icon={faTrash} />}
        onClick={handleDeleteShare}
        title={'Delete share link'}
      />
    </>
  );
};

export default ShareActions;
