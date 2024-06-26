'use server'; // since this is an async component
import React from 'react';

import { notFound, redirect } from 'next/navigation';
import { Session } from 'next-auth';

import NotAuthorized from '@/app/not-authorized';
import { auth } from '@/auth';
import MainContent from '@/components/chat/main';
import { AI } from '@/lib/aiProvider';
import { ChatHistory, blankAIState } from '@/models/chat';
import { focuses, getFocusWithSubFocus } from '@/models/focus';
import { getChat } from '@/services/historyService';

type HomePageProps = {
  params: {
    chatid: string;
  };
  searchParams: {
    focus?: string;
    subFocus?: string;
  };
};

const getCachedChat = React.cache(async (chatid: string, userId: string) => {
  const chat = await getChat(chatid, userId);

  return chat;
});

export const generateMetadata = async ({
  params: { chatid },
  searchParams: { focus, subFocus },
}: HomePageProps) => {
  if (chatid === 'new') {
    return {
      title: 'New Chat',
    };
  }

  const session = (await auth()) as Session;

  if (!session?.user?.id) {
    return;
  }

  const chat = await getCachedChat(chatid, session.user.id);

  return {
    title: chat?.title ?? 'Chat',
  };
};

const ChatPage = async ({
  params: { chatid },
  searchParams: { focus, subFocus },
}: HomePageProps) => {
  const session = (await auth()) as Session;

  // middleware should take care of this, but if it doesn't then redirect to login
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const chat: ChatHistory | null =
    chatid !== 'new'
      ? await getCachedChat(chatid, session.user.id)
      : newChatSession(session, focus, subFocus);

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
    <AI initialAIState={chat}>
      <MainContent />
    </AI>
  );
};

export default ChatPage;

const newChatSession = (
  session: Session,
  focusParam?: string,
  subFocusParam?: string
) => {
  const focus = getFocusWithSubFocus(focusParam, subFocusParam);

  const chat: ChatHistory = {
    ...blankAIState,
    // id is '' in state until submitUserMessage() is called
    focus: focus ?? focuses[0],
    user: session.user?.name ?? 'Unknown User',
    userId: session.user?.id ?? 'Unknown User',
  };

  return chat;
};
