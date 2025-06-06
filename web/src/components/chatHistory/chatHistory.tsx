'use server'; // since this is async
import React from 'react';

import { campusMap } from '@/lib/constants';

import { WonkReturnObject, isWonkSuccess } from '../../lib/error/error';
import WonkyClientError from '../../lib/error/wonkyClientError';
import {
  ChatHistoryTitleEntry,
  getChatHistoryForGroup,
} from '../../services/historyService';

import ChatHistoryWrapper from './chatHistoryWrapper';

interface ChatHistoryProps {
  group: string;
}

const loadChatHistoryForGroup = React.cache(
  async (group: string): Promise<WonkReturnObject<ChatHistoryTitleEntry[]>> => {
    return await getChatHistoryForGroup(group);
  }
);

const ChatHistory: React.FC<ChatHistoryProps> = async ({ group }) => {
  // don't show anything if we don't have a group or if it isn't valid
  if (!group || !campusMap[group]) {
    return <></>;
  }

  // we have a valid group, so just show the chat history for that group

  let chats: ChatHistoryTitleEntry[] = [];
  try {
    const result = await loadChatHistoryForGroup(group);

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
