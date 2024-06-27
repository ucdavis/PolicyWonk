'use server'; // since this is an async component
import React from 'react';

import { Metadata, ResolvingMetadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Session } from 'next-auth';

import { auth } from '@/auth';
import MainContent from '@/components/chat/main';
import { AI } from '@/lib/aiProvider';
import { cleanMetadataTitle } from '@/lib/util';
import { ChatHistory } from '@/models/chat';
import { getSharedChat } from '@/services/historyService';

type SharedPageProps = {
  params: {
    shareid: string;
  };
};

const getCachedSharedChat = React.cache(async (shareid: string) => {
  const chat = await getSharedChat(shareid);

  return chat;
});

export async function generateMetadata(
  { params }: SharedPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { shareid } = params;
  const chat = await getCachedSharedChat(shareid);

  return {
    title: chat?.title ? cleanMetadataTitle(chat.title) : 'Chat',
  };
}

const SharePage = async ({ params: { shareid } }: SharedPageProps) => {
  const session = (await auth()) as Session;

  // middleware should take care of this, but if it doesn't then redirect to login
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const chat: ChatHistory | null = await getCachedSharedChat(shareid);

  if (!chat) {
    return notFound();
  }

  return (
    <AI initialAIState={chat}>
      <h5>Shared Chat</h5>
      <hr />
      <MainContent />
    </AI>
  );
};

export default SharePage;
