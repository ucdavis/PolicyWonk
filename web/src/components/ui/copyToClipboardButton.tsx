import React from 'react';

import { faCopy } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface CopyToClipboardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({
  value,
  onClick,
  className,
  ...rest
}) => {
  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    // since this is in an onclick, it should be okay to use navigator
    navigator.clipboard.writeText(value);
    onClick?.(e);
  };

  return (
    <button
      type='button'
      className={
        className ??
        'btn btn-ghost btn-lg btn-square mr-1 bg-transparent text-base-content/60 shadow-none hover:bg-transparent hover:text-primary active:bg-transparent disabled:bg-transparent'
      }
      onClick={handleCopy}
      title='Copy to clipboard'
      {...rest}
    >
      <FontAwesomeIcon icon={faCopy} />
    </button>
  );
};

export default CopyToClipboardButton;
