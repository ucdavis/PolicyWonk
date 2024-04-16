import React from 'react';

import { Session } from 'next-auth';

import { auth } from '@/auth';
import { getChatHistory } from '@/services/historyService';

import ChatHistoryList from './chatHistoryList';

const loadChatHistory = React.cache(async (userId: string) => {
  console.log('loading chat history');
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
      <h1>Chat History</h1>
      {chats?.length ? <ChatHistoryList chats={chats} /> : <>No chat history</>}
    </>
  );
};

export default ChatHistory;
