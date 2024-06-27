'use client';
import React from 'react';

import ErrorBoundary from '@/lib/error/errorBoundary';

import Policywonksvg from './policywonksvg';

export const WonkPortrait = React.memo(function WonkPortrait({
  isLoading,
}: {
  isLoading?: boolean;
}) {
  return (
    <div className='role-portrait'>
      <ErrorBoundary>
        <Policywonksvg
          width={42}
          height={42}
          alt={'Policy Wonk portrait'}
          className={`${isLoading ? 'wonk-portrait-loading' : ''} chat-portrait`}
        />
      </ErrorBoundary>
    </div>
  );
});
