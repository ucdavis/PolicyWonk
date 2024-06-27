'use client';
import React from 'react';

import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from 'reactstrap';

import { deleteChatFromSidebar } from '@/lib/actions';
import ErrorBoundary from '@/lib/error/errorBoundary';
import WonkError from '@/lib/error/wonkError';
import { ChatHistory } from '@/models/chat';

interface ChatHistoryList {
  chats: ChatHistory[];
}

// separate out rendering the chat list so we can animate it as a client component
const ChatHistoryList: React.FC<ChatHistoryList> = ({ chats }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isHovering, setIsHovering] = React.useState<null | string>(null);
  const [isLoading, setIsLoading] = React.useState<null | string>(null);

  if (!chats) {
    return null;
  }

  const isActive = (chatId: string) => {
    return pathname.includes(chatId);
  };

  const handleRemoveChat = async (chatId: string) => {
    router.prefetch(`/chat/new`);
    const isActiveChat = isActive(chatId);
    setIsLoading(chatId);
    await deleteChatFromSidebar(chatId, isActiveChat);
    setIsLoading(null);
    if (isActiveChat) {
      // deleteChatFromSidebar will handle the redirect to '/'
      // because i could not get the router here to both refresh and redirect reliably
    } else {
      router.refresh();
    }
  };

  return (
    <ErrorBoundary
      fallback={<WonkError componentName='chat history' type='text' />}
    >
      <ul className='history-list'>
        <AnimatePresence initial={false}>
          {chats.map((chat) => (
            <motion.li
              className={`history-list-group-item ${isActive(chat.id) ? 'active' : ''}`}
              key={chat.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: 'auto',
                opacity: 1,
                transition: {
                  duration: 0.4,
                  ease: 'easeIn',
                },
              }}
              exit={{
                height: 0,
                opacity: 0,
                transition: { duration: 0.3, ease: 'easeOut' },
              }}
              onHoverStart={() => {
                setIsHovering(chat.id);
              }}
              onHoverEnd={() => {
                setIsHovering(null);
              }}
            >
              <div className='row'>
                <div className='col-11'>
                  <Link href={`/chat/${chat.id}`}>{chat.title}</Link>
                </div>
                <div className='col-1 delete-chat-button'>
                  {((isHovering !== null && isHovering === chat.id) ||
                    isLoading === chat.id) && (
                    <Button
                      block={false}
                      color='link'
                      onClick={() => handleRemoveChat(chat.id)}
                      disabled={isLoading !== null}
                    >
                      <FontAwesomeIcon icon={faTrash} size='lg' />
                    </Button>
                  )}
                </div>
              </div>
              <div className='history-fade' />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </ErrorBoundary>
  );
};

export default ChatHistoryList;
