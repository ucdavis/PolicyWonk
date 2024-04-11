'use server'; // since we are doing process.env
import React from 'react';

import { nanoid } from 'nanoid';
import { notFound, redirect } from 'next/navigation';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

import { auth } from '@/auth';
import MainContent from '@/components/chat/main';
import { AI, getUIStateFromAIState } from '@/lib/actions';
import { ChatHistory, defaultLlmModel } from '@/models/chat';
import { getChat } from '@/services/historyService';

type HomePageProps = {
  params: {
    chatid: string;
  };
};

const ChatPage = async ({ params: { chatid } }: HomePageProps) => {
  const session = (await auth()) as Session;

  // TODO: throw errors in getChat??
  const chat: ChatHistory | null =
    chatid !== 'new' ? await getChat(chatid) : newChatSession(session);

  // if getChat returns null
  // will happen if the user is at an /chat/{id} that is not /chat/new
  // but the chat does not exist
  if (!chat) {
    return notFound();
  }

  // if (chat.userId !== session.user?.id) {
  //   return notFound();
  // }

  if (session?.user) {
    // filter out sensitive data before passing to client.
    session.user = {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    };
  }

  return (
    <SessionProvider session={session}>
      <AI initialAIState={chat} initialUIState={getUIStateFromAIState(chat)}>
        <MainContent />
      </AI>
    </SessionProvider>
  );
};

export default ChatPage;

const newChatSession = (session: Session) => {
  const chat: ChatHistory = {
    id: nanoid(),
    title: 'Unknown Title',
    messages: [],
    llmModel: process.env.OPENAI_LLM_MODEL ?? defaultLlmModel,
    user: session.user?.name ?? 'Unknown User',
    userId: session.user?.id ?? 'Unknown User',
    timestamp: Date.now(),
  };
  return chat;
};
