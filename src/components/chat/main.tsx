'use client';

import { useChat, Message } from 'ai/react';
import Image from 'next/image';
import React from 'react';

import { getChatMessages } from '@/services/chatService';

import Logo from '../../../public/media/policy-wonk.png';
import { ChatMessage } from '../chatMessage';

import Ask from './ask';

const MainContent: React.FC = () => {
  const { messages, setMessages, reload, append } = useChat({
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

      <div className='input-group d-flex justify-content-center mt-auto'>
        <input
          type='text'
          disabled
          className='form-control me-2'
          placeholder='How many holidays are in march?'
        />
        <input
          type='text'
          disabled
          className='form-control'
          placeholder='How many holidays are in march?'
        />
      </div>

      <Ask onQuestionSubmitted={onQuestionSubmitted} />

      <p className='disclaimer-text'>
        Disclaimer: The information provided by Policywonk is for general
        informational purposes only and should not be considered legal or
        professional advice. Always consult with the appropriate experts and
        refer to official policies for accurate and up-to-date information.
      </p>
    </main>
  );
};

export default MainContent;
