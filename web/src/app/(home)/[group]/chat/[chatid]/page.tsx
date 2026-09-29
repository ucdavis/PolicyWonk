'use server'; // since this is an async component
import React from 'react';

import { Metadata, ResolvingMetadata } from 'next';

import { auth } from '@/auth';
import MainContent from '@/components/chat/main';
import { isWonkSuccess, WonkStatusCodes } from '@/lib/error/error';
import WonkyPageError from '@/lib/error/wonkyPageError';
import { isValidGroupName } from '@/lib/groups';
import { cleanMetadataTitle } from '@/lib/util';
import { ChatHistory, blankAIState } from '@/models/chat';
import { WonkSession } from '@/models/session';
import { getChat } from '@/services/historyService';
import { FocusSelectionError, resolveFocus } from '@/services/unionCatalog';

type HomePageProps = {
  params: Promise<{
    group: string;
    chatid: string;
  }>;
  searchParams: Promise<{
    focus?: string;
    subFocus?: string;
  }>;
};

const getCachedChat = React.cache(async (chatid: string) => {
  const chat = await getChat(chatid);

  return chat;
});

export async function generateMetadata(
  props: HomePageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;
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

const ChatPage = async (props: HomePageProps) => {
  const searchParams = await props.searchParams;

  const { focus, subFocus } = searchParams;

  const params = await props.params;

  const { group, chatid } = params;

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
    try {
      chat = await newChatSession(session, group, focus, subFocus);
    } catch (error) {
      if (error instanceof FocusSelectionError) {
        return (
          <div className='container py-4' role='alert'>
            <p>{error.message}</p>
            <a href={`/${group}/chat/new`}>Choose a focus</a>
          </div>
        );
      }
      throw error;
    }
  }

  return <MainContent initialChat={chat} />;
};

export default ChatPage;

const newChatSession = async (
  session: WonkSession,
  group: string,
  focusParam?: string,
  subFocusParam?: string
) => {
  const focus = await resolveFocus(group, focusParam, subFocusParam);

  const chat: ChatHistory = {
    ...blankAIState,
    // id is '' in state until the chat is saved
    group,
    meta: {
      focus,
    },
    userId: session.userId,
  };

  return chat;
};
