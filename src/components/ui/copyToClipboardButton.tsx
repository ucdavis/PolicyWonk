import React from 'react';

import { faCopy } from '@fortawesome/free-regular-svg-icons';
import { faCopy as faCopySolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { HTMLMotionProps } from 'framer-motion';

import AnimatedButtonEnhanced from './aButtonEnhanced';

interface CopyToClipboardButtonProps extends HTMLMotionProps<'button'> {
  value: string;
  selected?: boolean;
  copyOnEnter?: boolean; // immediately copies to the clipboard
  animateOnChange?: boolean;
  clearOnChange?: boolean;
}

const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({
  value,
  selected,
  copyOnEnter,
  animateOnChange = false,
  clearOnChange = false,
  ...rest
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
  };

  return (
    <AnimatedButtonEnhanced
      displayBeforeClick={
        <FontAwesomeIcon icon={copyOnEnter && !!value ? faCopySolid : faCopy} />
      }
      displayOnClick={<FontAwesomeIcon icon={faCopySolid} />}
      onClick={handleCopy}
      clearOnHover={!copyOnEnter} // keep solid icon since we immediately copied
      title='Copy to clipboard'
      selected={selected}
      animateOnEnter={copyOnEnter}
      animateOnChange={animateOnChange}
      trackedValue={value}
      {...rest}
    />
  );
};

export default CopyToClipboardButton;
