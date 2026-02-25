'use client';

import type { ReactNode } from 'react';

import WonkyClientError from '../../../lib/error/wonkyClientError';
import WonkyErrorBoundary from '../../../lib/error/wonkyErrorBoundary';
import WonkAnswer from './wonkAnswer';

export const WonkMessage = ({
  content,
  isLoading,
  children,
}: {
  content: string;
  isLoading: boolean;
  children?: ReactNode;
}) => {
  return (
    <div className='chat-row'>
      <div className='d-flex'>
        <div>
          {content ? (
            <WonkyErrorBoundary
              fallback={
                <WonkyClientError
                  type='alert'
                  thereWasAnErrorLoadingThe='answer'
                />
              }
            >
              <WonkAnswer text={content} />
            </WonkyErrorBoundary>
          ) : (
            <p className='text-muted mb-0'>
              {isLoading ? 'PolicyWonk is thinking…' : ''}
            </p>
          )}
        </div>
      </div>
      {!isLoading && children}
    </div>
  );
};
