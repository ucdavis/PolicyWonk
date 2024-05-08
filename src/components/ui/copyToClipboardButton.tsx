import React from 'react';

import { faCopy } from '@fortawesome/free-regular-svg-icons';
import { faCopy as faCopySolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { HTMLMotionProps } from 'framer-motion';

import AnimatedButton from './animatedButton';

interface CopyToClipboardButtonProps extends HTMLMotionProps<'button'> {
  value: string;
  selected?: boolean;
  animateOnEnter?: boolean;
  animateOnChange?: boolean;
  clearOnChange?: boolean;
}

const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({
  value,
  selected,
  animateOnEnter,
  animateOnChange = false,
  clearOnChange = false,
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
      animateOnChange={animateOnChange && !!value ? value : false} // only animate change if there is a value
      clearOnChange={clearOnChange && !!value ? value : false} // only track changes if there is a value (i.e. )
      {...rest}
    />
  );
};

export default CopyToClipboardButton;
