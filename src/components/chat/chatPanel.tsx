'use client';

import { useChat, Message } from 'ai/react';
import React from 'react';

import { getChatMessages } from '@/services/chatService';

import ChatBox from './chatBox';
import ChatHeader from './chatHeader';
import { ChatMessage } from './chatMessage';
import DefaultQuestions from './defaultQuestions';

const ChatPanel: React.FC = () => {
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
    <div>
      {messages?.length === 0 && !isLoading && <ChatHeader />}
      {messages?.length === 0 && isLoading && <p>Loading...</p>}
      {messages
        .filter((m) => m.role === 'assistant' || m.role === 'user')
        .map((m: Message) => (
          <div key={m.id}>
            <strong>{`${m.role}: `}</strong>
            <ChatMessage message={m} />
          </div>
        ))}

      <DefaultQuestions
        onQuestionSubmitted={onQuestionSubmitted}
        allowSend={!isLoading}
      />

      <ChatBox
        onQuestionSubmitted={onQuestionSubmitted}
        allowSend={!isLoading}
      />
    </div>
  );
};

export default ChatPanel;
