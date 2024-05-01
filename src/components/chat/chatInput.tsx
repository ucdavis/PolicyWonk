'use client';
import React from 'react';

import { useUIState, useActions } from 'ai/rsc';
import { nanoid } from 'nanoid';

import { AI } from '@/lib/actions';

import ChatBoxForm from './chatBoxForm';
import DefaultQuestions from './defaultQuestions';
import FocusBar from './focusBar';
import { UserMessage } from './userMessage';

// Container for all of components that can be used to send messages to the chat
// Will send the actual message to the chatAI system
const ChatInput = () => {
  const [_, setMessagesUI] = useUIState<typeof AI>();
  // instead of passing in a submit function, we use a server action defined in actions.tsx when we create the AI
  const { submitUserMessage } = useActions();

  const onQuestionSubmit = async (question: string) => {
    // Optimistically add user message UI
    setMessagesUI((currentMessages) => [
      ...currentMessages,
      {
        id: nanoid(),
        display: <UserMessage>{question}</UserMessage>,
      },
    ]);

    const responseMessage = await submitUserMessage(question);

    setMessagesUI((currentMessages) => [...currentMessages, responseMessage]);
  };
  return (
    <>
      <DefaultQuestions onQuestionSubmit={onQuestionSubmit} />
      <FocusBar />
      <ChatBoxForm onQuestionSubmit={onQuestionSubmit} />
    </>
  );
};

export default ChatInput;
