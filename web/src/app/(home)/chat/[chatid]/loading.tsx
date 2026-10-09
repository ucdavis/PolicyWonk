import React from 'react';

import ChatHeader from '@/components/chat/chatHeader';

const Loading: React.FC = () => {
  return (
    <div className='min-h-0 flex-1 overflow-y-auto pt-16 lg:pt-4'>
      <div className='mx-auto w-full max-w-3xl'>
        <ChatHeader>Loading, please wait...</ChatHeader>
      </div>
    </div>
  );
};

export default Loading;
