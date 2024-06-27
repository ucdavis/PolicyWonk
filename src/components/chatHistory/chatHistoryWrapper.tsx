'use client';
import WonkyBoundary from '@/lib/error/errorBoundary';
import WonkError from '@/lib/error/wonkError';
import { ChatHistory } from '@/models/chat';

import ChatHistoryList from './chatHistoryList';

interface ChatHistoryWrapperProps {
  chats: ChatHistory[];
}

// Wrapper for the chat history to handle errors
const ChatHistoryWrapper: React.FC<ChatHistoryWrapperProps> = ({ chats }) => {
  return (
    <WonkyBoundary
      fallback={
        <WonkError thereWasAnErrorLoadingThe='chat history' type='text' />
      }
    >
      {chats?.length ? (
        <ChatHistoryList chats={chats} />
      ) : (
        <>No chat history found</>
      )}
    </WonkyBoundary>
  );
};

export default ChatHistoryWrapper;
