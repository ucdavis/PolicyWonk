'use client';

import type { ReactNode } from 'react';

import WonkyClientError from '../../../lib/error/wonkyClientError';
import WonkyErrorBoundary from '../../../lib/error/wonkyErrorBoundary';

import WonkAnswer from './wonkAnswer';

export const WonkMessage = ({
  content,
  isLoading,
  thought,
  children,
}: {
  content: string;
  isLoading: boolean;
  thought?: string | null;
  children?: ReactNode;
}) => {
  return (
    <div className='chat-row'>
      <div className='d-flex'>
        <div>
          {isLoading && !content && (
            <p className='text-muted mb-2'>
              {thought || 'PolicyWonk is thinking…'}
            </p>
          )}
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
          ) : null}
        </div>
      </div>
      {!isLoading && children}
    </div>
  );
};
