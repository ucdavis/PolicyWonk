import React from 'react';

import Image from 'next/image';

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

export const UserPortrait = React.memo(function UserPortrait() {
  return (
    <div className='role-portrait'>
      <Image
        width={42}
        height={42}
        className='chat-portrait'
        src={'/media/ph-profile.svg'}
        alt={'Your user portrait'}
      />
    </div>
  );
});
