'use server'; // since this is async
import React from 'react';

import { WonkReturnObject, isWonkSuccess } from '../../lib/error/error';
import WonkyClientError from '../../lib/error/wonkyClientError';
import {
  ChatHistoryTitleEntry,
  getChatHistory,
} from '../../services/historyService';

import ChatHistoryWrapper from './chatHistoryWrapper';

const loadChatHistory = React.cache(
  async (): Promise<WonkReturnObject<ChatHistoryTitleEntry[]>> => {
    return await getChatHistory();
  }
);

const ChatHistory: React.FC = async () => {
  let chats: ChatHistoryTitleEntry[] = [];
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
      <div className='chat-history-wrapper'>
        <h3 className='text-end'>Chat History</h3>
        <div className='chat-history'>
          <WonkyClientError
            thereWasAnErrorLoadingThe='chat history'
            type='text'
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='chat-history-wrapper'>
        <h3 className='text-end'>Chat History</h3>
        <div className='chat-history'>
          {!!chats && <ChatHistoryWrapper chats={chats} />}
        </div>
      </div>
    </>
  );
};

export default ChatHistory;
