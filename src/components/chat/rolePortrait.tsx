'use client';
import React from 'react';

import Policywonksvg from './policywonksvg';

export const WonkPortrait = React.memo(function WonkPortrait({
  isLoading,
}: {
  isLoading?: boolean;
}) {
  return (
    <div className='role-portrait'>
      <Policywonksvg
        width={42}
        height={42}
        alt={'Policy Wonk portrait'}
        className={`${isLoading ? 'wonk-portrait-loading' : ''} chat-portrait`}
      />
    </div>
  );
});
