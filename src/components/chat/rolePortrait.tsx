import React from 'react';

import Image from 'next/image';

import Policywonksvg from './policywonksvg';

const RolePortrait = React.memo(function RolePortrait({
  role,
  roleDisplayName,
  isLoading,
}: {
  role: string;
  roleDisplayName: string;
  isLoading?: boolean;
}) {
  return (
    <div className='role-portrait'>
      {isLoading && role === 'assistant' ? (
        <Policywonksvg />
      ) : (
        <Image
          width={42}
          height={42}
          className='chat-portrait'
          src={
            role === 'assistant'
              ? '/media/ph-robot.svg'
              : '/media/ph-profile.svg'
          }
          alt={roleDisplayName}
        />
      )}
    </div>
  );
});

export default RolePortrait;
