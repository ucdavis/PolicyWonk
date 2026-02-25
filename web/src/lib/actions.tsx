'use server';

import { redirect } from 'next/navigation';

import type { Feedback } from '@/models/chat';
import { WonkServerError, isWonkSuccess } from '@/lib/error/error';
import {
  removeChat,
  removeShareChat,
  saveReaction,
  saveShareChat,
} from '@/services/historyService';

export const shareChat = async (chatId: string): Promise<string> => {
  const result = await saveShareChat(chatId);
  if (!isWonkSuccess(result)) {
    return WonkServerError();
  }

  return result.data;
};

export const unshareChat = async (chatId: string): Promise<void> => {
  const result = await removeShareChat(chatId);
  if (!isWonkSuccess(result)) {
    return WonkServerError();
  }
};

export const submitFeedback = async (
  chatId: string,
  feedback: Feedback
): Promise<void> => {
  const result = await saveReaction(chatId, feedback);
  if (!isWonkSuccess(result)) {
    return WonkServerError();
  }
};

/**
 * this happens outside of the chat UI, so it does not update local state
 */
export const deleteChatFromSidebar = async (
  chatId: string,
  isActiveChat: boolean
) => {
  const result = await removeChat(chatId);
  if (!isWonkSuccess(result)) {
    return WonkServerError();
  }
  if (isActiveChat) {
    redirect('/');
  }
};

