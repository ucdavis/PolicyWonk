'use server'; // since this is an async component
import React from 'react';

import { Metadata, ResolvingMetadata } from 'next';
import { Session } from 'next-auth';

import { auth } from '@/auth';
import MainContent from '@/components/chat/main';
import { AI } from '@/lib/aiProvider';
import { isWonkSuccess } from '@/lib/error/error';
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

  const result = await getCachedChat(chatid);

  return {
    title:
      isWonkSuccess(result) && result.data.title
        ? cleanMetadataTitle(result.data.title)
        : 'Chat',
  };
}

const ChatPage = async ({
  params: { chatid },
  searchParams: { focus, subFocus },
}: HomePageProps) => {
  let chat: ChatHistory;

  if (chatid !== 'new') {
    // any unexpected or server errors will be caught by the error.tsx boundary instead of crashing the page
    const result = await getCachedChat(chatid);
    if (!isWonkSuccess(result)) {
      return <WonkyPageError status={result.status} />;
    }
    chat = result.data;
  } else {
    const session = (await auth()) as Session;
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
