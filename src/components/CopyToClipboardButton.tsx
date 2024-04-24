import React from 'react';

import { faCopy } from '@fortawesome/free-regular-svg-icons';
import { faCopy as faCopySolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Variants, motion } from 'framer-motion';

import AnimatedButton from './animatedButton';

interface CopyToClipboardButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  id: string;
  value: string;
  className: string;
  variants?: Variants;
  children?: React.ReactNode;
}

const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({
  id,
  value,
  className,
  variants,
  children,
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
  };

  return (
    <>
      <AnimatedButton
        id={id}
        displayBeforeClick={<FontAwesomeIcon icon={faCopy} />}
        displayAfterClick={<FontAwesomeIcon icon={faCopySolid} />}
        onClick={handleCopy}
        clearOnHover={true}
      />
    </>
  );
};

export default CopyToClipboardButton;
