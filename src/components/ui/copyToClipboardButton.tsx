import React from 'react';

import { faCopy } from '@fortawesome/free-regular-svg-icons';
import { faCopy as faCopySolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import AnimatedButton from './animatedButton';

interface CopyToClipboardButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({
  value,
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
  };

  return (
    <AnimatedButton
      displayBeforeClick={<FontAwesomeIcon icon={faCopy} />}
      displayAfterClick={<FontAwesomeIcon icon={faCopySolid} />}
      onClick={handleCopy}
      clearOnHover={true}
    />
  );
};

export default CopyToClipboardButton;
