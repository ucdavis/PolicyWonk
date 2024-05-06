import React from 'react';

import { faCopy } from '@fortawesome/free-regular-svg-icons';
import { faCopy as faCopySolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { HTMLMotionProps, animate } from 'framer-motion';

import AnimatedButton from './animatedButton';

interface CopyToClipboardButtonProps extends HTMLMotionProps<'button'> {
  value: string;
  selected?: boolean;
  animateOnEnter?: boolean;
}

const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({
  value,
  selected,
  animateOnEnter,
  ...rest
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
  };

  return (
    <AnimatedButton
      displayBeforeClick={<FontAwesomeIcon icon={faCopy} />}
      displayOnClick={<FontAwesomeIcon icon={faCopySolid} />}
      onClick={handleCopy}
      clearOnHover={true}
      title='Copy to clipboard'
      selected={selected}
      animateOnEnter={animateOnEnter}
      {...rest}
    />
  );
};

export default CopyToClipboardButton;
