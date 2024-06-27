import React from 'react';

import WonkyBoundary from '@/lib/error/errorBoundary';

import Logo from '../layout/logo';

const ChatHeader: React.FC<{ children: React.ReactNode }> = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className='home-message'>
      <WonkyBoundary>
        <Logo />
      </WonkyBoundary>
      <p className='lede'>{children}</p>
    </div>
  );
};

export default ChatHeader;
