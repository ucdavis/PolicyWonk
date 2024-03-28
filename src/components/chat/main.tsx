'use client';

import { useChat, Message } from 'ai/react';
import Image from 'next/image';
import React from 'react';

import { getChatMessages } from '@/services/chatService';

import Logo from '../../../public/media/policy-wonk.svg';
import { ChatMessage } from '../chatMessage';

import Ask from './ask';

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
  const RolePortrait = ({ role }: { role: string }) => {
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
  };

  return (
    <main className='wonk-container'>
      <div className='wonk-top'>
        <Image
          className='img-fluid policy-png mb-2'
          src={Logo}
          alt='Aggie Gold Robot cartoon'
        />
        <p className='lede'>
          Meet Policywonk, your personal guide to navigating all the ins and
          outs of UCD policies...
        </p>
        {messages
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
      </div>
      <div className='wonk-bottom'>
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

        <Ask onQuestionSubmitted={onQuestionSubmitted} allowSend={!isLoading} />

        <p className='discreet mt-2'>
          Disclaimer: The information provided by Policywonk is for general
          informational purposes only and should not be considered legal or
          professional advice. Always consult with the appropriate experts and
          refer to official policies for accurate and up-to-date information.
        </p>
      </div>
    </main>
  );
};

export default MainContent;
