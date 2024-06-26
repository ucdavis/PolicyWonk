'use client';
import React from 'react';

import { useUIState, useActions, useAIState } from 'ai/rsc';
import { nanoid } from 'nanoid';

import { AI } from '@/lib/aiProvider';
import { useGtagEvent } from '@/lib/hooks/useGtagEvent';
import { focuses } from '@/models/focus';
import { GTagEvents } from '@/models/gtag';

import FocusBanner from '../answer/focusBanner';
import { UserMessage } from '../userMessage';

import ChatBoxForm from './chatBoxForm';
import DefaultQuestions from './defaultQuestions';
import FocusBar from './focusBar';

// Container for all of components that can be used to send messages to the chat
// Will send the actual message to the chatAI system
const ChatInput = () => {
  const gtagEvent = useGtagEvent();
  const [aiState] = useAIState<typeof AI>();
  const [_, setMessagesUI] = useUIState<typeof AI>();

  const [focus, setFocus] = React.useState(aiState.focus);

  // instead of passing in a submit function, we use a server action defined in actions.tsx when we create the AI
  const { submitUserMessage } = useActions<typeof AI>();

  const onQuestionSubmit = async (question: string) => {
    // Optimistically add user message UI
    setMessagesUI((currentMessages) => [
      ...currentMessages,
      {
        id: nanoid(),
        display: (
          <>
            <FocusBanner focus={focus} />
            <UserMessage>{question}</UserMessage>
          </>
        ),
      },
    ]);

    const responseMessage = await submitUserMessage(question, focus);

    gtagEvent({
      event: GTagEvents.NEW_CHAT,
      chat: { ...aiState, focus },
    });

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
