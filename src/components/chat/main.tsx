'use client';
import React from 'react';

import { useChat, Message } from 'ai/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { getChatMessages } from '@/services/chatService';

import Disclaimer from '../layout/disclaimer';
import WonkBottom from '../layout/wonkBottom';
import WonkTop from '../layout/wonkTop';

import ChatBox from './chatBox';
import ChatHeader from './chatHeader';
import { ChatMessage } from './chatMessage';
import DefaultQuestions from './defaultQuestions';

const MainContent: React.FC = () => {
  const router = useRouter();

  const { messages, setMessages, reload, append, isLoading } = useChat({
    api: '/api/chat',
  });

  const onQuestionSubmitted = async (question: string) => {
    if (messages.length === 0) {
      const newMessages = await getChatMessages(question);
      setMessages(newMessages);
      reload();
    } else {
      append({
        role: 'user',
        content: question,
      });
    }
  };

  const onNewMessage = () => {
    router.push('/new');
  };

  return (
    <div className='wonk-container'>
      {messages?.length === 0 && !isLoading ? (
        <>
          <WonkTop>
            <ChatHeader />
          </WonkTop>
          <WonkBottom>
            <DefaultQuestions
              onQuestionSubmitted={onQuestionSubmitted}
              allowSend={!isLoading}
            />
            <ChatBox
              onQuestionSubmitted={onQuestionSubmitted}
              allowSend={!isLoading && messages.length === 0}
              onNewMessage={onNewMessage}
            />
            <Disclaimer />
          </WonkBottom>
        </>
      ) : (
        <>
          <WonkTop>
            {messages // TODO: add suspense boundary and loading animation
              .filter((m) => m.role === 'assistant' || m.role === 'user')
              .map((m: Message) => (
                <div className='row mb-3' key={m.id}>
                  <div className='col-1'>
                    <RolePortrait role={m.role} />
                  </div>
                  <div className='col-11'>
                    <p className='chat-name'>
                      <strong>{`${m.role}: `}</strong>
                    </p>

                    <ChatMessage message={m} />
                  </div>
                </div>
              ))}
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

const RolePortrait = React.memo(function RolePortrait({
  role,
}: {
  role: string;
}) {
  return (
    <div className='role-portrait'>
      <Image
        width={42}
        height={42}
        className='chat-image'
        src={
          role === 'assistant' ? '/media/ph-robot.png' : '/media/ph-user.png'
        }
        alt={role}
      />
    </div>
  );
});
