import React from 'react';

import Logo from '../layout/logo';

const ChatHeader: React.FC<{ children: React.ReactNode }> = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <>
      <div className='home-message'>
        <Logo />
        <p className='lede'>{children}</p>
      </div>
    </>
  );
};

export default ChatHeader;
