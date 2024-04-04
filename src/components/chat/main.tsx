'use client';
import React from 'react';

import { useChat, Message } from 'ai/react';
import { useAIState, useUIState } from 'ai/rsc';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';

import { getChatMessages } from '@/services/chatService';
import { logMessages } from '@/services/loggingService';

import Disclaimer from '../layout/disclaimer';
import WonkBottom from '../layout/wonkBottom';
import WonkTop from '../layout/wonkTop';

import ChatBox from './chatBox';
import ChatHeader from './chatHeader';
import { ChatMessageContainer } from './chatMessageContainer';
import DefaultQuestions from './defaultQuestions';
import Feedback from './feedback';

interface MainContentProps {
  chatId: string;
}
const MainContent: React.FC<MainContentProps> = ({ chatId }) => {
  const router = useRouter();
  const [messages] = useUIState();
  const [aiState] = useAIState();

  React.useEffect(() => {
    const messagesLength = aiState.messages?.length;
    if (messagesLength === 2) {
      router.refresh();
    }
  }, [aiState.messages, router]);

  const onNewMessage = () => {
    router.push('/new');
  };

  return (
    <div className='wonk-container'>
      {!messages.length ? (
        <>
          <WonkTop>
            <ChatHeader />
          </WonkTop>
          <WonkBottom>
            <DefaultQuestions />
            <ChatBox />
            <Disclaimer />
          </WonkBottom>
        </>
      ) : (
        <>
          <WonkTop>
            {messages // TODO: add suspense boundary and loading animation
              .filter((m: any) => m.role === 'assistant' || m.role === 'user')
              .map((m: Message) => {
                return <div key={m.id}>{messages.display}</div>;
              })}
          </WonkTop>
          <WonkBottom>
            <div className='d-flex flex-column'>
              <button
                className='btn btn-primary mt-3 mb-3'
                onClick={() => {
                  onNewMessage();
                }}
                aria-label='Ask another question'
              >
                Ask another question
              </button>
            </div>
          </WonkBottom>
        </>
      )}
    </div>
  );
};

export default MainContent;
