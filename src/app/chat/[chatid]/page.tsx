import React from 'react';

import { SessionProvider } from 'next-auth/react';

import { auth } from '@/auth';
import MainContent from '@/components/chat/main';
import { AI } from '@/lib/actions';
import { ChatSession } from '@/models/chat';
import { getChat } from '@/services/historyService';

type HomePageProps = {
  params: {
    chatid: string;
  };
};

const ChatPage = async ({ params: { chatid } }: HomePageProps) => {
  const session = await auth();

  if (session?.user) {
    // filter out sensitive data before passing to client.
    session.user = {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    };
  }

  const chat: ChatSession | undefined =
    chatid !== 'new' ? await getChat(chatid) : undefined;

  return (
    <SessionProvider session={session}>
      <AI initialAIState={chat}>
        <MainContent chat={chat} />
      </AI>
    </SessionProvider>
  );
};

export default ChatPage;
