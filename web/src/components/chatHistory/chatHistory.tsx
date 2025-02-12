'use server'; // since this is async
import React from 'react';

import { WonkReturnObject, isWonkSuccess } from '../../lib/error/error';
import WonkyClientError from '../../lib/error/wonkyClientError';
import { ChatHistory as ChatHistoryInterface } from '../../models/chat'; // TODO: rename
import { getChatHistory } from '../../services/historyService';

import ChatHistoryWrapper from './chatHistoryWrapper';

const loadChatHistory = React.cache(
  async (): Promise<WonkReturnObject<ChatHistoryInterface[]>> => {
    return await getChatHistory();
  }
);

const ChatHistory: React.FC = async () => {
  let chats: ChatHistoryInterface[] = [];
  try {
    const result = await loadChatHistory();

    if (!isWonkSuccess(result)) {
      return <></>; // don't show anything on known errors
    }
    chats = result.data;
  } catch (error) {
    // same return as the fallback in the error boundary
    // but we have to do it here too, since the error boundary doesn't catch server errors
    return (
      <div className='history-wrapper'>
        <h2>Chat History</h2>
        <WonkyClientError
          thereWasAnErrorLoadingThe='chat history'
          type='text'
        />
      </div>
    );
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
