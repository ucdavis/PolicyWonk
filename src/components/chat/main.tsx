'use client';
import React from 'react';

import { useChat, Message } from 'ai/react';
import { nanoid } from 'nanoid';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { getChatMessages } from '@/services/chatService';
import { logMessages } from '@/services/loggingService';

import Disclaimer from '../layout/disclaimer';
import WonkBottom from '../layout/wonkBottom';
import WonkTop from '../layout/wonkTop';

import ChatBox from './chatBox';
import ChatHeader from './chatHeader';
import { ChatMessage } from './chatMessage';
import DefaultQuestions from './defaultQuestions';
import Feedback from './feedback';

const MainContent: React.FC = () => {
  const router = useRouter();

  const chatId = React.useMemo(() => nanoid(), []);

  const { messages, setMessages, reload, append, isLoading } = useChat({
    api: '/api/chat',
    id: chatId,
  });

  React.useEffect(() => {
    const logAsyncMessages = async () => {
      const relevantMessages = messages.filter(
        (m) => m.role === 'assistant' || m.role === 'user'
      );

      await logMessages(chatId, relevantMessages);
    };

    if (!isLoading && messages.length > 2) {
      logAsyncMessages();
    }
  }, [messages, isLoading, chatId]);

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
            {messages.length > 2 &&
              messages[messages.length - 1].role === 'assistant' &&
              !isLoading && <Feedback chatId={chatId} />}
          </WonkTop>
          <WonkBottom>
            <div className='d-flex flex-column mt-3'>
              <button
                className='btn btn-primary mt-3'
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
