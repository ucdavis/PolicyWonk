import React from 'react';

import { Session } from 'next-auth';

import { auth } from '@/auth';
import { getChatHistory } from '@/services/historyService';

const loadChatHistory = React.cache(async (userId: string) => {
  console.log('loading chat history');
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
      <div className='history-wrapper'>
        <h2>Chat History</h2>
        {chats?.length ? (
          <ul className='history-list'>
            {chats.map((chat) => (
              <li className='history-list-group-item' key={chat.id}>
                <a href={`/chat/${chat.id}`}>{chat.title}</a>
              </li>
            ))}
          </ul>
        ) : (
          <>No chat history</>
        )}
      </div>
    </>
  );
};

export default ChatHistory;
