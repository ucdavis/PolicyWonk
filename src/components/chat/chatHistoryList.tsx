'use client';
import React from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

import { ChatHistory } from '@/models/chat';

interface ChatHistoryList {
  chats: ChatHistory[];
}

// separate out rendering the chat list so we can animate it as a client component
const ChatHistoryList: React.FC<ChatHistoryList> = ({ chats }) => {
  if (!chats) return null;

  return (
    <ul className='list-group'>
      <AnimatePresence initial={false}>
        {chats.map((chat) => (
          <motion.li
            className='list-group-item'
            key={chat.id}
            // TODO: don't animate on initial render of list, but still animate when adding new chats
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{
              duration: 0.25,
              ease: 'easeIn',
            }}
          >
            <Link href={`/chat/${chat.id}`}>{chat.title}</Link>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
};

export default ChatHistoryList;