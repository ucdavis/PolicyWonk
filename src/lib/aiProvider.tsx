import { Message } from 'ai';
import { createAI, getAIState } from 'ai/rsc';
import { redirect } from 'next/navigation';
import { Session } from 'next-auth';

import { auth } from '@/auth';
import FocusBanner from '@/components/chat/answer/focusBanner';
import { WonkMessage } from '@/components/chat/answer/wonkMessage';
import { UserMessage } from '@/components/chat/userMessage';
import { ChatHistory, UIState, blankAIState } from '@/models/chat';

import {
  WonkActions,
  deleteChat,
  shareChat,
  submitFeedback,
  submitUserMessage,
  unshareChat,
} from './actions';

// AI is a provider you wrap your application with so you can access AI and UI state in your components.
export const AI = createAI<ChatHistory, UIState, WonkActions>({
  actions: {
    submitUserMessage,
    shareChat,
    unshareChat,
    submitFeedback,
    deleteChat,
  },
  initialUIState: [],
  initialAIState: blankAIState,
  onGetUIState: async () => {
    'use server';

    const session = (await auth()) as Session;
    // middleware should take care of this, but if it doesn't then redirect to login
    if (!session?.user?.id) {
      redirect('/auth/login');
    }
    const aiState = getAIState();
    const messages: Message[] = aiState.messages;
    return messages
      .filter((message) => message.role !== 'system')
      .map((message: Message, index) => ({
        id: message.id,
        display:
          message.role === 'user' ? (
            <>
              <FocusBanner focus={aiState.focus} />
              <UserMessage user={aiState.user}>{message.content}</UserMessage>
            </>
          ) : (
            <WonkMessage
              content={message.content}
              isLoading={false}
              wonkThoughts={''}
            />
          ),
      }));
  },
  // not using onSetAIState, instead we are manually saving to the db with historyService
});
