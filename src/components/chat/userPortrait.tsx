import React from 'react';

import Image from 'next/image';
import { useSession } from 'next-auth/react';

export const UserPortrait = React.memo(function UserPortrait() {
  const session = useSession();

  const userImage = session?.data?.user?.image || '/media/ph-profile.svg';
  return (
    <div className='role-portrait'>
      <Image
        width={42}
        height={42}
        className='chat-portrait'
        src={userImage}
        alt={'User Portrait'}
      />
    </div>
  );
});
