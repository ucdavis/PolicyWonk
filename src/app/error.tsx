'use client';
import React from 'react';

import ChatHeader from '@/components/chat/chatHeader';
import WonkTop from '@/components/layout/wonkTop';
import WonkyComponentError from '@/lib/error/wonkyComponentError';

// this is the default error component displayed when there is an uncaught error
// the only thing higher than this is the global-error, which catches errors in the layout
const Error: React.FC = () => {
  return (
    <WonkTop>
      <ChatHeader>
        <WonkyComponentError
          thereWasAnErrorLoadingThe='page'
          type={'alert'}
          contactLink={true}
        />
      </ChatHeader>
    </WonkTop>
  );
};

export default Error;
