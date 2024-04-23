'use client';
import React from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ChatHistory } from '@/models/chat';

interface ChatHistoryList {
  chats: ChatHistory[];
}

// separate out rendering the chat list so we can animate it as a client component
const ChatHistoryList: React.FC<ChatHistoryList> = ({ chats }) => {
  const pathname = usePathname();
  if (!chats) return null;

  return (
    <ul className='history-list'>
      <AnimatePresence initial={false}>
        {chats.map((chat) => (
          <motion.li
            className={`history-list-group-item ${pathname === `/chat/${chat.id}` ? 'active' : ''}`}
            key={chat.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{
              duration: 0.3,
              ease: 'easeIn',
            }}
          >
            <Link href={`/chat/${chat.id}`}>{chat.title}</Link>
            <div className='history-fade'></div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
};

export default ChatHistoryList;
