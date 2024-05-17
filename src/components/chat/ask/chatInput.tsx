'use client';
import React from 'react';

import { useUIState, useActions } from 'ai/rsc';
import { nanoid } from 'nanoid';

import { AI, Actions } from '@/lib/actions';
import { gtagEvent, GTagEvents } from '@/lib/gtag';
import { focuses } from '@/models/focus';

import FocusBanner from '../answer/focusBanner';
import { UserMessage } from '../userMessage';

import ChatBoxForm from './chatBoxForm';
import DefaultQuestions from './defaultQuestions';
import FocusBar from './focusBar';

// Container for all of components that can be used to send messages to the chat
// Will send the actual message to the chatAI system
const ChatInput = () => {
  const [focus, setFocus] = React.useState(focuses[0]);

  const [_, setMessagesUI] = useUIState<typeof AI>();

  // instead of passing in a submit function, we use a server action defined in actions.tsx when we create the AI
  // as Actions maybe a little hack but it lets us strongly type the actions
  const { submitUserMessage } = useActions() as Actions;

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

    // TODO: use full AI state
    gtagEvent({ event: GTagEvents.NEW_CHAT });

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
