import React from 'react';

import { getChats } from '@/services/historyService';

const ChatHistory: React.FC = async () => {
  const chats = await getChats();

  if (!chats) return null;

  return (
    <div className='container'>
      <h1>Chat History</h1>
      <ul className='list-group'>
        {chats.map((chat) => (
          <li className='list-group-item' key={chat.id}>
            <a href={`/chat/${chat.id}`}>{chat.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatHistory;
