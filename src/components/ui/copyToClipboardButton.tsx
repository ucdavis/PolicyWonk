import React from 'react';

import { faCopy } from '@fortawesome/free-regular-svg-icons';
import { faCopy as faCopySolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { HTMLMotionProps } from 'framer-motion';

import AnimatedButtonEnhanced from './aButtonEnhanced';

interface CopyToClipboardButtonProps extends HTMLMotionProps<'button'> {
  value: string;
  selected?: boolean;
  copyOnEnter?: boolean;
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
      displayBeforeClick={<FontAwesomeIcon icon={faCopy} />}
      displayOnClick={<FontAwesomeIcon icon={faCopySolid} />}
      onClick={handleCopy}
      clearOnHover={true}
      title='Copy to clipboard'
      selected={selected}
      animateOnEnter={copyOnEnter}
      showClickedOnEnter={copyOnEnter}
      animateOnChange={animateOnChange}
      trackedValue={value}
      // animateOnChange={animateOnChange && !!value ? value : false} // only animate change if there is a value
      // clearOnChange={clearOnChange && !!value ? value : false} // only track changes if there is a value (i.e. )
      {...rest}
    />
  );
};

export default CopyToClipboardButton;
