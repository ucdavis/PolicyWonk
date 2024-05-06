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
    sharedid: string;
  };
};
// TODO: loading animation when chatId changes
const SharePage = async ({ params: { sharedid } }: SharedPageProps) => {
  const session = (await auth()) as Session;

  // middleware should take care of this, but if it doesn't then redirect to login
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const chat: ChatHistory | null = await getSharedChat(sharedid);

  // if getChat returns null
  // will happen if the user is at an /chat/{id} that is not /chat/new
  // but the chat does not exist
  if (!chat) {
    return notFound();
  }

  return (
    <AI initialAIState={chat} initialUIState={getUIStateFromAIState(chat)}>
      <div className='row'>
        <div className='col-10'>
          <h2>Shared Chat</h2>
        </div>
        <div className='col-2'>
          <button>button</button>
        </div>
        <hr />
      </div>
      <MainContent shared={true} />
    </AI>
  );
};

export default SharePage;
