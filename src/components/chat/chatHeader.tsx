import React from 'react';

import WonkyErrorBoundary from '@/lib/error/wonkyErrorBoundary';

import Logo from '../layout/logo';

const ChatHeader: React.FC<{ children: React.ReactNode }> = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className='home-message'>
      <WonkyErrorBoundary>
        <Logo />
      </WonkyErrorBoundary>
      <div className='lede'>{children}</div>
    </div>
  );
};

export default ChatHeader;
