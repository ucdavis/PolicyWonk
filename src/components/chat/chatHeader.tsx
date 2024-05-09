import React from 'react';

import Image from 'next/image';

import Logo from '/public/media/policy-wonk.svg';

const ChatHeader: React.FC<{ children: React.ReactNode }> = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <>
      <div className='home-message'>
        <Image
          className='img-fluid policy-png mb-4'
          src={Logo}
          alt='Aggie Gold Robot cartoon'
        />
        <p className='lede'>{children}</p>
      </div>
    </>
  );
};

export default ChatHeader;
