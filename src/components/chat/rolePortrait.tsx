import React from 'react';

import Image from 'next/image';

import Policywonksvg from './policywonksvg';

export const WonkPortrait = React.memo(function WonkPortrait({
  roleDisplayName,
  isLoading,
}: {
  roleDisplayName: string;
  isLoading?: boolean;
}) {
  return (
    <div className='role-portrait'>
      <Policywonksvg
        width={42}
        height={42}
        alt={roleDisplayName}
        className={`${isLoading ? 'wonk-portrait-loading' : ''} chat-portrait`}
      />
    </div>
  );
});

export const UserPortrait = React.memo(function UserPortrait({
  roleDisplayName,
}: {
  roleDisplayName: string;
}) {
  return (
    <div className='role-portrait'>
      <Image
        width={42}
        height={42}
        className='chat-portrait'
        src={'/media/ph-profile.svg'}
        alt={roleDisplayName}
      />
    </div>
  );
});
