'use client';
import WonkyError from '@/lib/error/wonkyError';
import WonkyErrorBoundary from '@/lib/error/wonkyErrorBoundary';
import { ChatHistory } from '@/models/chat';

import ChatHistoryList from './chatHistoryList';

interface ChatHistoryWrapperProps {
  chats: ChatHistory[];
}

// Wrapper for the chat history to handle errors
const ChatHistoryWrapper: React.FC<ChatHistoryWrapperProps> = ({ chats }) => {
  return (
    <WonkyErrorBoundary
      fallback={
        <WonkyError thereWasAnErrorLoadingThe='chat history' type='text' />
      }
    >
      {chats?.length ? (
        <ChatHistoryList chats={chats} />
      ) : (
        <>No chat history found</>
      )}
    </WonkyErrorBoundary>
  );
};

export default ChatHistoryWrapper;
