'use server'; // since this is an async component
import React from 'react';

import { notFound, redirect } from 'next/navigation';
import { Session } from 'next-auth';

import { auth } from '@/auth';
import MainContent from '@/components/chat/main';
import { AI, getUIStateFromAIState } from '@/lib/actions';
import { ChatHistory } from '@/models/chat';
import { getSharedChat } from '@/services/historyService';

type SharedPageProps = {
  params: {
    shareid: string;
  };
};
// TODO: loading animation when chatId changes
const SharePage = async ({ params: { shareid } }: SharedPageProps) => {
  const session = (await auth()) as Session;

  // middleware should take care of this, but if it doesn't then redirect to login
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const chat: ChatHistory | null = await getSharedChat(shareid);

  if (!chat) {
    return notFound();
  }

  return (
    <AI initialAIState={chat} initialUIState={getUIStateFromAIState(chat)}>
      <h5>Shared Chat</h5>
      <hr />
      <MainContent shared={true} />
    </AI>
  );
};

export default SharePage;
