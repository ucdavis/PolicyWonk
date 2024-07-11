'use server'; // since this is async
import React from 'react';

import { WonkReturnObject, WonkStatusCodes } from '@/lib/error/error';
import WonkyPageError from '@/lib/error/wonkyPageError';
import { ChatHistory as ChatHistoryInterface } from '@/models/chat'; // TODO: rename
import { getChatHistory } from '@/services/historyService';

import ChatHistoryWrapper from './chatHistoryWrapper';

const loadChatHistory = React.cache(
  async (): Promise<WonkReturnObject<ChatHistoryInterface[]>> => {
    return await getChatHistory();
  }
);

const ChatHistory: React.FC = async () => {
  const { data: chats, status } = await loadChatHistory();
  if (status !== WonkStatusCodes.SUCCESS) {
    return <WonkyPageError status={status} />;
  }

  return (
    <>
      <div className='history-wrapper'>
        <h2>Chat History</h2>
        {!!chats && <ChatHistoryWrapper chats={chats} />}
      </div>
    </>
  );
};

export default ChatHistory;
