'use client';

import { useUIState, useActions, useAIState } from '@ai-sdk/rsc';
import { nanoid } from 'nanoid';
import { useSession } from 'next-auth/react';

import { AI } from '../../../lib/aiProvider';
import { useGtagEvent } from '../../../lib/hooks/useGtagEvent';
import { Focus } from '../../../models/focus';
import { GTagEvents } from '../../../models/gtag';
import { UserMessage } from '../userMessage';

import ChatBoxForm from './chatBoxForm';
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
    setAIState((a) => ({ ...a, meta: { ...a.meta, focus } }));
  };

  const onQuestionSubmit = async (question: string) => {
    // Optimistically add user message UI
    setMessagesUI((currentMessages) => [
      ...currentMessages,
      {
        id: nanoid(),
        display: (
          <>
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
    <div className='wonk-chat-width'>
      <FocusBar
        group={aiState.group}
        focus={aiState.meta.focus}
        onSelection={onFocusSelection}
      />
      <ChatBoxForm onQuestionSubmit={onQuestionSubmit} />
    </div>
  );
};

export default ChatInput;
