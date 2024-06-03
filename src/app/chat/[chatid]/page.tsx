'use server'; // since this is an async component
import React from 'react';

import { nanoid } from 'nanoid';
import { notFound, redirect } from 'next/navigation';
import { Session } from 'next-auth';

import NotAuthorized from '@/app/not-authorized';
import { auth } from '@/auth';
import MainContent from '@/components/chat/main';
import { AI, getUIStateFromAIState } from '@/lib/actions';
import { ChatHistory } from '@/models/chat';
import { focuses } from '@/models/focus';
import { llmModel } from '@/services/chatService';
import { getChat } from '@/services/historyService';

type HomePageProps = {
  params: {
    chatid: string;
  };
  searchParams: {
    focus?: string;
  };
};
// TODO: loading animation when chatId changes
const ChatPage = async ({
  params: { chatid },
  searchParams: { focus },
}: HomePageProps) => {
  const session = (await auth()) as Session;

  // middleware should take care of this, but if it doesn't then redirect to login
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const chat: ChatHistory | null =
    chatid !== 'new'
      ? await getChat(chatid, session.user.id)
      : newChatSession(session, focus);

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
const newChatSession = (session: Session, focusParam?: string) => {
  let focus = focuses[0];

  if (focusParam) {
    const foundFocus = focuses.find((f) => f.name === focusParam);
    if (foundFocus) {
      focus = foundFocus;
    }
  }

  const chat: ChatHistory = {
    id: nanoid(),
    title: 'Unknown Title',
    messages: [],
    focus: focus,
    llmModel: llmModel,
    user: session.user?.name ?? 'Unknown User',
    userId: session.user?.id ?? 'Unknown User',
    timestamp: Date.now(),
  };
  return chat;
};
