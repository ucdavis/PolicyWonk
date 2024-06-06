import React from 'react';

import { faCopy } from '@fortawesome/free-regular-svg-icons';
import { faCopy as faCopySolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { HTMLMotionProps } from 'framer-motion';

import AnimatedButton from './animatedButton';

interface CopyToClipboardButtonProps extends HTMLMotionProps<'button'> {
  value: string;
}

const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({
  value,
  onClick,
  ...rest
}) => {
  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    // since this is in an onclick, it should be okay to use navigator
    navigator.clipboard.writeText(value);
    onClick?.(e);
  };

  return (
    <AnimatedButton
      displayBeforeClick={<FontAwesomeIcon icon={faCopy} />}
      displayOnClick={<FontAwesomeIcon icon={faCopySolid} />}
      onClick={handleCopy}
      clearOnHover={true}
      title='Copy to clipboard'
      {...rest}
    />
  );
};

export default CopyToClipboardButton;
