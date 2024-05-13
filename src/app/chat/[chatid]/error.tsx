'use client';
import React from 'react';

import ChatHeader from '@/components/chat/chatHeader';
import WonkTop from '@/components/layout/wonkTop';

const NotFound: React.FC = () => {
  return (
    <>
      <WonkTop>
        <ChatHeader>Sorry, something went wrong</ChatHeader>
      </WonkTop>
    </>
  );
};

export default NotFound;
