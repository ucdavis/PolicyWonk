'use server'; // since this is an async component
import React from 'react';

import { nanoid } from 'nanoid';
import { notFound } from 'next/navigation';
import { Session } from 'next-auth';

import { auth } from '@/auth';
import MainContent from '@/components/chat/main';
import NotAuthorized from '@/components/layout/not-authorized';
import { AI, getUIStateFromAIState } from '@/lib/actions';
import { ChatHistory } from '@/models/chat';
import { llmModel } from '@/services/chatService';
import { getChat } from '@/services/historyService';

type HomePageProps = {
  params: {
    chatid: string;
  };
};
// TODO: loading animation when chatId changes
const ChatPage = async ({ params: { chatid } }: HomePageProps) => {
  const session = (await auth()) as Session;

  // middleware should take care of this
  if (!session?.user?.id) {
    return null;
  }
  const chat: ChatHistory | null =
    chatid !== 'new'
      ? await getChat(chatid, session.user.id)
      : newChatSession(session);

  // if getChat returns null
  // will happen if the user is at an /chat/{id} that is not /chat/new
  // but the chat does not exist
  if (!chat) {
    return notFound();
  }

  if (chat.userId !== session.user?.id) {
    return <NotAuthorized />;
  }

  return (
    <AI initialAIState={chat} initialUIState={getUIStateFromAIState(chat)}>
      <MainContent />
    </AI>
  );
};

export default ChatPage;

// TODO: move this into a server-only file
const newChatSession = (session: Session) => {
  const chat: ChatHistory = {
    id: nanoid(),
    title: 'Unknown Title',
    messages: [],
    llmModel: llmModel,
    user: session.user?.name ?? 'Unknown User',
    userId: session.user?.id ?? 'Unknown User',
    timestamp: Date.now(),
  };
  return chat;
};
