import { createAI, getAIState } from '@ai-sdk/rsc';

import FocusBanner from '../components/chat/answer/focusBanner';
import { WonkMessage } from '../components/chat/answer/wonkMessage';
import { UserMessage } from '../components/chat/userMessage';
import type { ChatMessage } from '../models/chat';
import { ChatHistory, UIState, blankAIState } from '../models/chat';

import {
  shareChat,
  submitFeedback,
  submitUserMessage,
  unshareChat,
} from './actions';
import type { WonkActions } from './actions';

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

    const aiState = getAIState() as ChatHistory;
    const messages: ChatMessage[] = aiState.messages;
    return messages
      .filter((message) => message.role !== 'system')
      .map((message: ChatMessage, index) => ({
        id: message.id,
        display:
          message.role === 'user' ? (
            <>
              <FocusBanner focus={aiState.meta.focus} />
              <UserMessage content={message.content} />
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
