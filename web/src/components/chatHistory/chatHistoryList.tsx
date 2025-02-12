'use client';
import React from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ChatHistory } from '../../models/chat';

import DeleteChatButton from './deleteChatButton';

interface ChatHistoryListProps {
  chats: ChatHistory[];
}

// separate out rendering the chat list so we can animate it as a client component
const ChatHistoryList: React.FC<ChatHistoryListProps> = ({ chats }) => {
  const pathname = usePathname();
  const [isHovering, setIsHovering] = React.useState<null | string>(null);

  if (!chats) {
    return null;
  }

  const isActive = (chatId: string) => {
    return pathname.includes(chatId);
  };

  return (
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
              <DeleteChatButton
                chatId={chat.id}
                isHovering={isHovering === chat.id}
              />
            </div>
            <div className='history-fade' />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
};

export default ChatHistoryList;
