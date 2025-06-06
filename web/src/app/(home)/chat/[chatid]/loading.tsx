import React from 'react';

import ChatHeader from '@/components/chat/chatHeader';
import WonkTop from '@/components/layout/wonkTop';

const Loading: React.FC = () => {
  return (
    <>
      <WonkTop>
        <ChatHeader>Loading, please wait...</ChatHeader>
      </WonkTop>
    </>
  );
};

export default Loading;
