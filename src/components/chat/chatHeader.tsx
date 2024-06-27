import React from 'react';

import ErrorBoundary from '@/lib/error/errorBoundary';

import Logo from '../layout/logo';

const ChatHeader: React.FC<{ children: React.ReactNode }> = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className='home-message'>
      <ErrorBoundary>
        <Logo />
      </ErrorBoundary>
      <p className='lede'>{children}</p>
    </div>
  );
};

export default ChatHeader;
