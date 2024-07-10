'use client';
import React from 'react';

import ChatHeader from '@/components/chat/chatHeader';
import WonkTop from '@/components/layout/wonkTop';
import { WonkError } from '@/lib/error/error';
import WonkyClientError from '@/lib/error/wonkyClientError';
import WonkyError from '@/lib/error/wonkyError';

interface ErrorProps {
  error?: WonkError;
  type?: 'text' | 'alert';
}
// this is the highest level error boundary, and catches any unhandled errors and stops the whole page crashing
const Error: React.FC<ErrorProps> = ({ error, type = 'alert' }) => {
  console.log('rendering Error: ', error);

  return (
    <>
      <WonkTop>
        <ChatHeader>
          {error ? (
            <WonkyError type={type} error={error} />
          ) : (
            <WonkyClientError
              thereWasAnErrorLoadingThe='page'
              type={type}
              contactLink={true}
            />
          )}
        </ChatHeader>
      </WonkTop>
    </>
  );
};

export default Error;
