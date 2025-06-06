'use server'; // since this is an async component
import React from 'react';

import { Metadata, ResolvingMetadata } from 'next';

import { auth } from '@/auth';
import MainContent from '@/components/chat/main';
import { AI } from '@/lib/aiProvider';
import { isWonkSuccess, WonkStatusCodes } from '@/lib/error/error';
import WonkyPageError from '@/lib/error/wonkyPageError';
import { isValidGroupFormat, isValidGroupName } from '@/lib/groups';
import { cleanMetadataTitle } from '@/lib/util';
import { ChatHistory, blankAIState } from '@/models/chat';
import { getFocusWithSubFocus, focuses } from '@/models/focus';
import { WonkSession } from '@/models/session';
import { getChat } from '@/services/historyService';

type HomePageProps = {
  params: {
    group: string;
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
  params: { group, chatid }, // Destructure group
  searchParams: { focus, subFocus },
}: HomePageProps) => {
  let chat: ChatHistory;

  // first, let's make sure we have a valid group
  if (!isValidGroupName(group)) {
    return <WonkyPageError status={WonkStatusCodes.NOT_FOUND} />;
  }

  if (chatid !== 'new') {
    // any unexpected or server errors will be caught by the error.tsx boundary instead of crashing the page
    const result = await getCachedChat(chatid);
    if (!isWonkSuccess(result)) {
      return <WonkyPageError status={result.status} />;
    }
    chat = result.data;
  } else {
    const session = (await auth()) as WonkSession;
    chat = newChatSession(session, group, focus, subFocus);
  }

  return (
    <AI initialAIState={chat}>
      <MainContent />
    </AI>
  );
};

export default ChatPage;

const newChatSession = (
  session: WonkSession,
  group: string,
  focusParam?: string,
  subFocusParam?: string
) => {
  const focus = getFocusWithSubFocus(focusParam, subFocusParam);

  const chat: ChatHistory = {
    ...blankAIState,
    // id is '' in state until submitUserMessage() is called
    group,
    meta: {
      focus: focus ?? focuses[0],
    },
    userId: session.userId,
  };

  return chat;
};
