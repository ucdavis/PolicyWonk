'use server'; // since this is an async component
import React from 'react';

import { Metadata, ResolvingMetadata } from 'next';

import MainContent from '@/components/chat/main';
import { AI } from '@/lib/aiProvider';
import { WonkReturnObject, isWonkSuccess } from '@/lib/error/error';
import WonkyPageError from '@/lib/error/wonkyPageError';
import { cleanMetadataTitle } from '@/lib/util';
import { ChatHistory } from '@/models/chat';
import { getSharedChat } from '@/services/historyService';

type SharedPageProps = {
  params: {
    shareid: string;
  };
};

const getCachedSharedChat = React.cache(
  async (shareid: string): Promise<WonkReturnObject<ChatHistory>> => {
    return await getSharedChat(shareid);
  }
);

export async function generateMetadata(
  { params }: SharedPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { shareid } = params;
  const result = await getCachedSharedChat(shareid);

  return {
    title:
      isWonkSuccess(result) && result.data.title
        ? cleanMetadataTitle(result.data.title)
        : 'Chat',
  };
}

const SharePage = async ({ params: { shareid } }: SharedPageProps) => {
  // any unexpected or server errors will be caught by the error.tsx boundary instead of crashing the page
  const result = await getCachedSharedChat(shareid);

  if (!isWonkSuccess(result)) {
    return <WonkyPageError status={result.status} />;
  }

  return (
    <AI initialAIState={result.data}>
      <h5>Shared Chat</h5>
      <hr />
      <MainContent />
    </AI>
  );
};

export default SharePage;
