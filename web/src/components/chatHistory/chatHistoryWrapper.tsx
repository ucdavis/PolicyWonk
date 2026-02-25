'use client';

import React from 'react';

import { usePathname } from 'next/navigation';

import { ChatHistoryTitleEntry } from '@/services/historyService';

import WonkyClientError from '../../lib/error/wonkyClientError';
import WonkyErrorBoundary from '../../lib/error/wonkyErrorBoundary';

import ChatHistoryList from './chatHistoryList';

interface ChatHistoryWrapperProps {
  group: string;
  chats: ChatHistoryTitleEntry[];
}

// Wrapper for the chat history to handle errors
const ChatHistoryWrapper: React.FC<ChatHistoryWrapperProps> = ({
  group,
  chats: initialChats,
}) => {
  const pathname = usePathname();
  const [chats, setChats] = React.useState<ChatHistoryTitleEntry[]>(
    initialChats
  );

  React.useEffect(() => {
    setChats(initialChats);
  }, [initialChats]);

  React.useEffect(() => {
    const prefix = `/${group}/chat/`;
    if (!pathname.startsWith(prefix)) {
      return;
    }

    const chatId = pathname.slice(prefix.length).split('/')[0];
    if (!chatId || chatId === 'new') {
      return;
    }

    let cancelled = false;

    const refreshChatHistory = async () => {
      try {
        const response = await fetch(
          `/api/history?group=${encodeURIComponent(group)}`,
          {
            method: 'GET',
            cache: 'no-store',
            credentials: 'same-origin',
          }
        );

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          chats?: (Omit<ChatHistoryTitleEntry, 'timestamp'> & {
            timestamp: string;
          })[];
        };

        const nextChats = (data.chats ?? []).map((chat) => ({
          ...chat,
          timestamp: new Date(chat.timestamp),
        })) as ChatHistoryTitleEntry[];

        if (!cancelled) {
          setChats(nextChats);
        }
      } catch {
        // ignore
      }
    };

    refreshChatHistory();

    return () => {
      cancelled = true;
    };
  }, [pathname, group]);

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
