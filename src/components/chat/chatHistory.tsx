import React from 'react';

import { Session } from 'next-auth';

import { auth } from '@/auth';
import { getChatHistory } from '@/services/historyService';

const loadChatHistory = React.cache(async (userId: string) => {
  return await getChatHistory(userId);
});

const ChatHistory: React.FC = async () => {
  const session = (await auth()) as Session;
  if (!session?.user?.id) {
    return <>No Session</>;
  }

  const chats = await loadChatHistory(session.user.id);

  return (
    <div className='container'>
      <h1>Chat History</h1>
      {chats?.length ? (
        <ul className='list-group'>
          {chats.map((chat) => (
            <li className='list-group-item' key={chat.id}>
              <a href={`/chat/${chat.id}`}>{chat.title}</a>
            </li>
          ))}
        </ul>
      ) : (
        <>No chat history</>
      )}
    </div>
  );
};

export default ChatHistory;
