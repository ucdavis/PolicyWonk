import React from 'react';

import { SessionProvider } from 'next-auth/react';

import { auth } from '@/auth';
import MainContent from '@/components/chat/main';
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
    // TODO: Look into https://react.dev/reference/react/experimental_taintObjectReference
    // filter out sensitive data before passing to client.
    session.user = {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    };
  }

  const chat: ChatSession | null =
    chatid !== 'new' ? await getChat(chatid) : null;

  return (
    <SessionProvider session={session}>
      <MainContent chat={chat} />;
    </SessionProvider>
  );
};

export default ChatPage;
