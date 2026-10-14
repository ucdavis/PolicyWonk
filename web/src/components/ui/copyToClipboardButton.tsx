import React from 'react';

import { faCopy } from '@fortawesome/free-regular-svg-icons';
import {
  faCheck,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
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
  const [copyStatus, setCopyStatus] = React.useState<
    'idle' | 'copied' | 'error'
  >('idle');
  const resetTimerRef = React.useRef<number | undefined>(undefined);

  const showCopyStatus = (status: 'copied' | 'error') => {
    window.clearTimeout(resetTimerRef.current);
    setCopyStatus(status);
    resetTimerRef.current = window.setTimeout(() => {
      resetTimerRef.current = undefined;
      setCopyStatus('idle');
    }, 3000);
  };

  React.useEffect(() => {
    return () => window.clearTimeout(resetTimerRef.current);
  }, []);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);

    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard access is unavailable');
      }

      await navigator.clipboard.writeText(value);
      showCopyStatus('copied');
    } catch {
      showCopyStatus('error');
    }
  };

  const feedback =
    copyStatus === 'copied'
      ? 'Copied to clipboard'
      : copyStatus === 'error'
        ? 'Could not copy to clipboard'
        : 'Copy to clipboard';

  return (
    <button
      type='button'
      className={`${
        className ??
        'btn btn-ghost btn-lg btn-square mr-1 bg-transparent text-base-content/60 shadow-none hover:bg-transparent hover:text-primary active:bg-transparent disabled:bg-transparent'
      } ${copyStatus === 'copied' ? 'text-success' : copyStatus === 'error' ? 'text-error' : ''}`}
      onClick={handleCopy}
      title={feedback}
      aria-label={feedback}
      {...rest}
    >
      <FontAwesomeIcon
        icon={
          copyStatus === 'copied'
            ? faCheck
            : copyStatus === 'error'
              ? faTriangleExclamation
              : faCopy
        }
      />
      <span className='sr-only' aria-live='polite'>
        {copyStatus === 'idle' ? '' : feedback}
      </span>
    </button>
  );
};

export default CopyToClipboardButton;
