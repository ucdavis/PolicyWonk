'use client';
import { ChatHistoryTitleEntry } from '@/services/historyService';

import WonkyClientError from '../../lib/error/wonkyClientError';
import WonkyErrorBoundary from '../../lib/error/wonkyErrorBoundary';

import ChatHistoryList from './chatHistoryList';

interface ChatHistoryWrapperProps {
  chats: ChatHistoryTitleEntry[];
}

// Wrapper for the chat history to handle errors
const ChatHistoryWrapper: React.FC<ChatHistoryWrapperProps> = ({ chats }) => {
  return (
    <WonkyErrorBoundary
      fallback={
        <WonkyClientError
          thereWasAnErrorLoadingThe='chat history'
          type='text'
        />
      }
    >
      {chats.length ? (
        <ChatHistoryList chats={chats} />
      ) : (
        <p className='text-end me-3'>No chat history found</p>
      )}
    </WonkyErrorBoundary>
  );
};

export default ChatHistoryWrapper;
