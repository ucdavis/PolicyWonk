'use client';
import React from 'react';

import ChatHeader from '@/components/chat/chatHeader';
import WonkTop from '@/components/layout/wonkTop';
import WonkyError from '@/lib/error/wonkyError';

const Error: React.FC = () => {
  return (
    <>
      <WonkTop>
        <ChatHeader>
          <WonkyError
            thereWasAnErrorLoadingThe='page'
            type='alert'
            contactLink={true}
          />
        </ChatHeader>
      </WonkTop>
    </>
  );
};

export default Error;
