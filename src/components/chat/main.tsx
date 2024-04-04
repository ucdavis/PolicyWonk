'use client';
import React from 'react';

import { useChat, Message } from 'ai/react';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';

import { getChatMessages } from '@/services/chatService';
import { saveChat } from '@/services/historyService';

import Disclaimer from '../layout/disclaimer';
import WonkBottom from '../layout/wonkBottom';
import WonkTop from '../layout/wonkTop';

import ChatBox from './chatBox';
import ChatHeader from './chatHeader';
import { ChatMessageContainer } from './chatMessageContainer';
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
    const onChatComplete = async () => {
      const relevantMessages = messages.filter(
        (m) => m.role === 'assistant' || m.role === 'user'
      );

      await saveChat(chatId, relevantMessages);
    };

    if (!isLoading && messages.length > 2) {
      onChatComplete();
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
              .map((m: Message) => {
                return (
                  <ChatMessageContainer
                    isLoading={isLoading}
                    key={m.id}
                    message={m}
                  />
                );
              })}
            {messages.length > 2 &&
              messages[messages.length - 1].role === 'assistant' &&
              !isLoading && <Feedback chatId={chatId} />}
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
