import { Message } from 'ai';
import { createAI, getAIState } from 'ai/rsc';

import FocusBanner from '@/components/chat/answer/focusBanner';
import { WonkMessage } from '@/components/chat/answer/wonkMessage';
import { UserMessage } from '@/components/chat/userMessage';
import { ChatHistory, UIState, blankAIState } from '@/models/chat';

import {
  WonkActions,
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
  },
  initialUIState: [],
  initialAIState: blankAIState,
  onGetUIState: async () => {
    'use server';

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
              <UserMessage user={aiState.user} content={message.content} />
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
