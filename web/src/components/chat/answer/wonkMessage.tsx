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
    <section
      className='mb-6 min-w-0 text-base leading-7 text-base-content focus:outline-none'
      aria-label='PolicyWonk response'
      tabIndex={0}
    >
      <h2 className='mb-1 text-lg font-semibold leading-tight'>PolicyWonk</h2>
      <div className='min-w-0'>
        {isLoading && !content && (
          <p className='mb-2 text-base-content/65'>
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
      {!isLoading && children && <div className='mt-3'>{children}</div>}
    </section>
  );
};
