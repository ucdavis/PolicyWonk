'use client';

import { useChat, Message } from 'ai/react';
import Image from 'next/image';
import React from 'react';

import { getChatMessages } from '@/services/chatService';

import Logo from '../../../public/media/policy-wonk.png';
import { ChatMessage } from '../chatMessage';

import Ask from './ask';
import DefaultQuestions from './defaultQuestions';

const MainContent: React.FC = () => {
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

  return (
    <main className='main-content d-flex flex-column'>
      <Image
        className='img-fluid policy-png'
        src={Logo}
        alt='Aggie Gold Robot cartoon'
      />
      <h2 className='main-title'>Policy Wonk</h2>
      <h3 className='sub-title'>Your UC Policy Expert</h3>
      <p className='intro-text'>
        Meet Policywonk, your personal guide to navigating all the ins and outs
        of UC policies...
      </p>
      {messages
        .filter((m) => m.role === 'assistant' || m.role === 'user')
        .map((m: Message) => (
          <div key={m.id}>
            <strong>{`${m.role}: `}</strong>
            <ChatMessage message={m} />
            <br />
            <br />
          </div>
        ))}

      <DefaultQuestions
        onQuestionSubmitted={onQuestionSubmitted}
        allowSend={!isLoading}
      />

      <Ask onQuestionSubmitted={onQuestionSubmitted} allowSend={!isLoading} />

      <p className='disclaimer-text small mt-2'>
        Disclaimer: The information provided by Policywonk is for general
        informational purposes only and should not be considered legal or
        professional advice. Always consult with the appropriate experts and
        refer to official policies for accurate and up-to-date information.
      </p>
    </main>
  );
};

export default MainContent;
