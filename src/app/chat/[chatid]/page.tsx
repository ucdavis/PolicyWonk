'server only';
import React from 'react';

import { Metadata, ResolvingMetadata } from 'next';
import { Session } from 'next-auth';

import NotAuthorized from '@/app/not-authorized';
import { auth } from '@/auth';
import MainContent from '@/components/chat/main';
import { AI } from '@/lib/aiProvider';
import { WonkStatusCodes } from '@/lib/error/error';
import { handleWonkReturnStatus } from '@/lib/error/useWonkReturn';
import { cleanMetadataTitle } from '@/lib/util';
import { ChatHistory, blankAIState } from '@/models/chat';
import { focuses, getFocusWithSubFocus } from '@/models/focus';
import { getChat } from '@/services/historyService';

import NotFound from '../../not-found';

type HomePageProps = {
  params: {
    chatid: string;
  };
  searchParams: {
    focus?: string;
    subFocus?: string;
  };
};

const getCachedChat = React.cache(async (chatid: string) => {
  const chat = await getChat(chatid);

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

  const chat = await getCachedChat(chatid);

  return {
    title: chat?.title ? cleanMetadataTitle(chat.title) : 'Chat',
  };
}

const ChatPage = async ({
  params: { chatid },
  searchParams: { focus, subFocus },
}: HomePageProps) => {
  const session = (await auth()) as Session;
  let chat: ChatHistory | undefined;

  if (chatid !== 'new') {
    const { data, status } = await getCachedChat(chatid);
    if (status !== WonkStatusCodes.SUCCESS) {
      return handleWonkReturnStatus(status);
    }
    chat = data;
  } else {
    chat = newChatSession(session, focus, subFocus);
  }

  if (!session?.user?.id) {
    return <NotAuthorized />;
  }
  if (!chat) {
    return <NotFound />;
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
