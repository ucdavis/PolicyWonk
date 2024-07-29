'use client'; // for React.memo
import React from 'react';

import Image from 'next/image';
import { useSession } from 'next-auth/react';

interface UserPortraitProps {
  for?: string;
}

export const UserPortrait = React.memo(function UserPortrait(
  props: UserPortraitProps
) {
  const session = useSession();

  let userImage = '/media/ph-profile.svg';

  // if the we are showing the user's portrait, use the user's image if it exists
  if (session?.data?.user?.name === props.for && session?.data?.user?.image) {
    userImage = session?.data?.user?.image;
  }

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
