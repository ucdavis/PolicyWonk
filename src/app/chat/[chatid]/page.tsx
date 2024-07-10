'server only';
import React from 'react';

import { Metadata, ResolvingMetadata } from 'next';
import { Session } from 'next-auth';

import { auth } from '@/auth';
import MainContent from '@/components/chat/main';
import { AI } from '@/lib/aiProvider';
import { WonkError, handleError } from '@/lib/error/error';
import WonkyPageError from '@/lib/error/wonkyPageError';
import { cleanMetadataTitle } from '@/lib/util';
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

const getCachedChat = React.cache(async (session: Session, chatid: string) => {
  const chat = await getChat(session, chatid);

  return chat;
});

export async function generateMetadata(
  { params, searchParams }: HomePageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { chatid } = params;
  if (chatid === 'new') {
    return {
      title: 'New Chat',
    };
  }

  const session = (await auth()) as Session;

  if (!session?.user?.id) {
    return {
      title: 'Chat',
    };
  }

  try {
    const chat = await getCachedChat(session, chatid);
    return {
      title: chat?.title ? cleanMetadataTitle(chat.title) : 'Chat',
    };
  } catch (e) {
    return {
      title: 'Chat',
    };
  }
}

const ChatPage = async ({
  params: { chatid },
  searchParams: { focus, subFocus },
}: HomePageProps) => {
  const session = (await auth()) as Session;

  let chat: ChatHistory | undefined;
  if (chatid !== 'new') {
    chat = await getCachedChat(session, chatid);
  } else {
    chat = newChatSession(session, focus, subFocus);
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
