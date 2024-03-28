'use client';

import React from 'react';

import { useChat, Message } from 'ai/react';
import { useRouter } from 'next/navigation';

import { getChatMessages } from '@/services/chatService';

import ChatBox from './chatBox';
import { ChatMessage } from './chatMessage';
import StartScreen from './startScreen';

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
    <div>
      {messages?.length === 0 && !isLoading ? (
        <>
          <StartScreen
            onQuestionSubmitted={onQuestionSubmitted}
            isLoading={isLoading}
          />
          <ChatBox
            onQuestionSubmitted={onQuestionSubmitted}
            allowSend={!isLoading && messages.length === 0}
            onNewMessage={onNewMessage}
          />
        </>
      ) : (
        <>
          <div>
            {messages // TODO: add suspense boundary / loading animation
              .filter((m) => m.role === 'assistant' || m.role === 'user')
              .map((m: Message) => (
                <div key={m.id}>
                  <strong>{`${m.role}: `}</strong>
                  <ChatMessage message={m} />
                </div>
              ))}
          </div>
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
        </>
      )}
    </div>
  );
};

export default MainContent;
