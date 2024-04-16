import React from 'react';

import Link from 'next/link';
import { Session } from 'next-auth';

import { auth } from '@/auth';
import { getChatHistory } from '@/services/historyService';

const loadChatHistory = React.cache(async (userId: string) => {
  return await getChatHistory(userId);
});

const ChatHistory: React.FC = async () => {
  const session = (await auth()) as Session;
  // display nothing if user isn't logged in
  if (!session?.user?.id) {
    return <></>;
  }

  const chats = await loadChatHistory(session.user.id);

  return (
    <>
      <h1>Chat History</h1>
      {chats?.length ? (
        <ul className='list-group'>
          {chats.map((chat) => (
            <li className='list-group-item' key={chat.id}>
              <Link href={`/chat/${chat.id}`}>{chat.title}</Link>
            </li>
          ))}
        </ul>
      ) : (
        <>No chat history</>
      )}
    </>
  );
};

export default ChatHistory;
