'use server';
import React from 'react';

import { Session } from 'next-auth';

import { auth } from '@/auth';
import { getChats } from '@/services/historyService';

const ChatHistory: React.FC = async () => {
  const session = (await auth()) as Session;
  console.log(session);
  if (!session?.user?.id) {
    return <>No Session</>;
  }

  const chats = await getChats(session.user.id);

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
