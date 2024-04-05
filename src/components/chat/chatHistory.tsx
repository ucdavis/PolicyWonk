'use server';
import React from 'react';

import { getChats } from '@/services/historyService';

const ChatHistory: React.FC = async () => {
  const chats = await getChats();

  return (
    <div className='container'>
      <h1>Chat History</h1>
      {chats}
    </div>
  );
};

export default ChatHistory;
