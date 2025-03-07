'use client';
import React from 'react';

import { useUIState, useActions, useAIState } from 'ai/rsc';
import { nanoid } from 'nanoid';
import { useSession } from 'next-auth/react';

import { AI } from '../../../lib/aiProvider';
import WonkyErrorBoundary from '../../../lib/error/wonkyErrorBoundary';
import { useGtagEvent } from '../../../lib/hooks/useGtagEvent';
import { Focus, focuses } from '../../../models/focus';
import { GTagEvents } from '../../../models/gtag';
import FocusBanner from '../answer/focusBanner';
import { UserMessage } from '../userMessage';

import ChatBoxForm from './chatBoxForm';
import DefaultQuestions from './defaultQuestions';
import FocusBar from './focusBar';

// Container for all of components that can be used to send messages to the chat
// Will send the actual message to the chatAI system
const ChatInput = () => {
  const gtagEvent = useGtagEvent();
  const session = useSession();
  const [aiState, setAIState] = useAIState<typeof AI>();
  const [_, setMessagesUI] = useUIState<typeof AI>();

  // instead of passing in a submit function, we use a server action defined in actions.tsx when we create the AI
  const { submitUserMessage } = useActions<typeof AI>();

  const onFocusSelection = (focus: Focus) => {
    setAIState((a) => ({ ...a, focus }));
  };

  const onQuestionSubmit = async (question: string) => {
    // Optimistically add user message UI
    setMessagesUI((currentMessages) => [
      ...currentMessages,
      {
        id: nanoid(),
        display: (
          <>
            <FocusBanner focus={aiState.focus} />
            <UserMessage
              user={session?.data?.user?.name || ''}
              content={question}
            />
          </>
        ),
      },
    ]);

    // TODO: handle errors
    const responseMessage = await submitUserMessage(question);

    gtagEvent({
      event: GTagEvents.NEW_CHAT,
      chat: { ...aiState },
    });

    setMessagesUI((currentMessages) => [...currentMessages, responseMessage]);
  };

  return (
    <>
      <WonkyErrorBoundary>
        <DefaultQuestions onQuestionSubmit={onQuestionSubmit} />
      </WonkyErrorBoundary>
      <FocusBar
        focus={aiState.focus}
        options={focuses}
        onSelection={onFocusSelection}
      />
      <ChatBoxForm onQuestionSubmit={onQuestionSubmit} />
    </>
  );
};

export default ChatInput;
