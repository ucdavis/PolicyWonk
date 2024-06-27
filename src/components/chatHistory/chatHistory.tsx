'use server'; // since this is async
import React from 'react';

import { Session } from 'next-auth';

import { auth } from '@/auth';
import { getChatHistory } from '@/services/historyService';

import ChatHistoryWrapper from './chatHistoryWrapper';

const loadChatHistory = React.cache(async (userId: string) => {
  return await getChatHistory(userId);
});

const ChatHistory: React.FC = async () => {
  const session = (await auth()) as Session;
  // display nothing if user isn't logged in
  if (!session?.user?.id) {
    return <></>;
  }

  const chats = await loadChatHistory(session.user.id);

  return (
    <>
      <div className='history-wrapper'>
        <h2>Chat History</h2>
        <ChatHistoryWrapper chats={chats} />
      </div>
    </>
  );
};

export default ChatHistory;
