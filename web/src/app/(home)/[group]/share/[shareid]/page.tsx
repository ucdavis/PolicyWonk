'use server'; // since this is an async component
import React from 'react';

import { Metadata, ResolvingMetadata } from 'next';

import { auth } from '@/auth';
import MainContent from '@/components/chat/main';
import { WonkReturnObject, isWonkSuccess } from '@/lib/error/error';
import WonkyPageError from '@/lib/error/wonkyPageError';
import { cleanMetadataTitle } from '@/lib/util';
import { ChatHistory } from '@/models/chat';
import type { WonkSession } from '@/models/session';
import { getSharedChat } from '@/services/historyService';

type SharedPageProps = {
  params: Promise<{
    group: string;
    shareid: string;
  }>;
};

const getCachedSharedChat = React.cache(
  async (shareid: string): Promise<WonkReturnObject<ChatHistory>> => {
    return await getSharedChat(shareid);
  }
);

export async function generateMetadata(
  props: SharedPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const session = (await auth()) as WonkSession;
  if (!session?.userId) {
    return { title: 'Chat' };
  }

  const params = await props.params;
  const { shareid } = params;
  const result = await getCachedSharedChat(shareid);

  return {
    title:
      isWonkSuccess(result) && result.data.title
        ? cleanMetadataTitle(result.data.title)
        : 'Chat',
  };
}

const SharePage = async (props: SharedPageProps) => {
  const params = await props.params;

  const { shareid } = params;

  // any unexpected or server errors will be caught by the error.tsx boundary instead of crashing the page
  const result = await getCachedSharedChat(shareid);

  if (!isWonkSuccess(result)) {
    return <WonkyPageError status={result.status} />;
  }

  return (
    <>
      <h5>Shared Chat</h5>
      <hr />
      <MainContent initialChat={result.data} />
    </>
  );
};

export default SharePage;
