'use client';
import { Alert } from 'reactstrap';

import { WonkError } from './error';

interface WonkyErrorProps {
  type: 'text' | 'alert';
  children?: React.ReactNode;
  error?: WonkError;
}

/**
 * @description Error component for client-side errors
 * @param type 'text' or 'alert'
 */

export const WonkyError: React.FC<WonkyErrorProps> = ({
  type,
  children,
  error,
}) => {
  const errorContent = (
    <>
      {error && (
        <>
          Error: {error.code} - {error.name}
          <br />
          {error.description}
        </>
      )}
      {children}
    </>
  );
  if (type === 'alert') {
    return <Alert color='danger'>{errorContent}</Alert>;
  }

  return <>{errorContent}</>;
};

export default WonkyError;
