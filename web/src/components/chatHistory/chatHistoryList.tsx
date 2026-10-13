'use client';

import React from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { ChatHistoryTitleEntry } from '@/services/historyService';

import { useCollapsibleSidebar } from '../layout/collapsibleSidebarProvider';

import DeleteChatButton from './deleteChatButton';

interface ChatHistoryListProps {
  chats: ChatHistoryTitleEntry[];
}

interface ChatHistoryItemProps {
  chat: ChatHistoryTitleEntry;
  isActive: boolean;
}

const ChatHistoryItem: React.FC<ChatHistoryItemProps> = ({
  chat,
  isActive,
}) => {
  const router = useRouter();
  const { onNavigate } = useCollapsibleSidebar();
  const titleRef = React.useRef<HTMLSpanElement>(null);
  const scrollTimerRef = React.useRef<number | undefined>(undefined);
  const [isHovering, setIsHovering] = React.useState(false);
  const [shouldScrollTitle, setShouldScrollTitle] = React.useState(false);
  const chatHref = `/${chat.group}/chat/${chat.id}`;

  const clearTitleScroll = React.useCallback(() => {
    window.clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = undefined;
    setShouldScrollTitle(false);
  }, []);

  const startTitleScroll = React.useCallback(() => {
    window.clearTimeout(scrollTimerRef.current);
    router.prefetch(chatHref);
    setIsHovering(true);

    if (
      titleRef.current?.scrollWidth &&
      titleRef.current.scrollWidth > titleRef.current.clientWidth
    ) {
      scrollTimerRef.current = window.setTimeout(() => {
        scrollTimerRef.current = undefined;
        setShouldScrollTitle(true);
      }, 1000);
    }
  }, [chatHref, router]);

  React.useEffect(() => clearTitleScroll, [clearTitleScroll]);

  return (
    <li
      className={`group relative mx-2 overflow-hidden rounded-lg text-sm text-base-content hover:bg-base-300 focus-within:bg-base-300 ${
        isActive ? 'bg-base-300' : ''
      }`}
      onMouseEnter={startTitleScroll}
      onMouseLeave={() => {
        setIsHovering(false);
        clearTitleScroll();
      }}
      onFocus={startTitleScroll}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setIsHovering(false);
          clearTitleScroll();
        }
      }}
    >
      <Link
        href={chatHref}
        className='flex w-full cursor-pointer items-center overflow-hidden px-2 py-3 text-left text-sm hover:bg-transparent active:bg-transparent lg:py-2'
        onClick={(event) => {
          if (
            event.button === 0 &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.shiftKey &&
            !event.altKey
          ) {
            onNavigate(() => {});
          }
        }}
      >
        <span className='min-w-0 flex-1 overflow-hidden'>
          <span
            className={
              shouldScrollTitle
                ? 'flex w-max animate-chat-title-scroll whitespace-nowrap'
                : 'block truncate'
            }
            ref={titleRef}
          >
            <span>{chat.title}</span>
            {shouldScrollTitle && (
              <span className='ml-8' aria-hidden='true'>
                {chat.title}
              </span>
            )}
          </span>
        </span>
      </Link>
      <DeleteChatButton chatId={chat.id} isHovering={isHovering} />
    </li>
  );
};

const ChatHistoryList: React.FC<ChatHistoryListProps> = ({ chats }) => {
  const pathname = usePathname();

  if (!chats) {
    return null;
  }

  return (
    <ul className='m-0 list-none p-0'>
      {chats.map((chat) => (
        <ChatHistoryItem
          chat={chat}
          isActive={pathname.includes(chat.id)}
          key={chat.id}
        />
      ))}
    </ul>
  );
};

export default ChatHistoryList;
