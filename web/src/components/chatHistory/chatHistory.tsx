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
  let status: 'ok' | 'skip' | 'error' = 'ok';
  try {
    const result = await loadChatHistoryForGroup(group);

    if (!isWonkSuccess(result)) {
      status = 'skip'; // don't show anything on known errors
    } else {
      chats = result.data;
    }
  } catch (error) {
    status = 'error';
  }

  if (status === 'skip') {
    return null;
  }

  if (status === 'error') {
    // same return as the fallback in the error boundary
    // but we have to do it here too, since the error boundary doesn't catch server errors
    return (
      <section className='mt-5 flex min-h-0 flex-1 flex-col'>
        <h2 className='mb-1 px-4 text-sm font-semibold'>Chats</h2>
        <div className='min-h-0 flex-1 overflow-y-auto px-4'>
          <WonkyClientError
            thereWasAnErrorLoadingThe='chat history'
            type='text'
          />
        </div>
      </section>
    );
  }

  return (
    <section className='mt-5 flex min-h-0 flex-1 flex-col'>
      <h2 className='mb-1 px-4 text-sm font-semibold'>Chats</h2>
      <div className='min-h-0 flex-1 overflow-y-auto'>
        {!!chats && <ChatHistoryWrapper group={group} chats={chats} />}
      </div>
    </section>
  );
};

export default ChatHistory;
