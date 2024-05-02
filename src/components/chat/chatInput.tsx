'use client';
import React from 'react';

import { useUIState, useActions, useAIState } from 'ai/rsc';
import { nanoid } from 'nanoid';

import { AI, Actions } from '@/lib/actions';
import { focuses } from '@/models/focus';

import ChatBoxForm from './chatBoxForm';
import DefaultQuestions from './defaultQuestions';
import FocusBar from './focusBar';
import { UserMessage } from './userMessage';

// Container for all of components that can be used to send messages to the chat
// Will send the actual message to the chatAI system
const ChatInput = () => {
  const [focus, setFocus] = React.useState(focuses[0]);

  const [_, setMessagesUI] = useUIState<typeof AI>();
  const [__, setAIState] = useAIState<typeof AI>();
  // instead of passing in a submit function, we use a server action defined in actions.tsx when we create the AI
  // as Actions maybe a little hack but it lets us strongly type the actions
  const { submitUserMessage } = useActions() as Actions;

  const onQuestionSubmit = async (question: string) => {
    // let the AI know what the focus is
    setAIState((currentAIState) => ({
      ...currentAIState,
      focus,
    }));

    // Optimistically add user message UI
    setMessagesUI((currentMessages) => [
      ...currentMessages,
      {
        id: nanoid(),
        display: <UserMessage>{question}</UserMessage>,
      },
    ]);

    const responseMessage = await submitUserMessage(question, focus);

    setMessagesUI((currentMessages) => [...currentMessages, responseMessage]);
  };
  return (
    <>
      <DefaultQuestions onQuestionSubmit={onQuestionSubmit} />
      <FocusBar focus={focus} options={focuses} onSelection={setFocus} />
      <ChatBoxForm onQuestionSubmit={onQuestionSubmit} />
    </>
  );
};

export default ChatInput;
