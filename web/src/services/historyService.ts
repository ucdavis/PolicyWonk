'server only';

import {
  JsonValue,
  InputJsonValue,
  JsonObject,
} from '@prisma/client/runtime/library';
import { Message } from 'ai';
import { nanoid } from 'nanoid';

import { auth } from '@/auth';
import prisma from '@/lib/db';
import {
  WonkReturnObject,
  WonkUnauthorized,
  WonkSuccess,
  WonkNotFound,
  WonkServerError,
} from '@/lib/error/error';
import { ChatHistory, ChatHistoryMetadata, Feedback } from '@/models/chat';
import { Focus } from '@/models/focus';
import { WonkSession } from '@/models/session';

import { llmModel } from './chatService';
import { logMessages, logReaction } from './loggingService';

const POLICY_ASSISTANT_SLUG = 'policywonk'; // just hardcode since we have only one assistant for now

export type ChatHistoryTitleEntry = {
  id: string;
  title: string;
  group: string;
  timestamp: Date;
};

const filterAndConvertMessages = (messages: JsonValue): Message[] => {
  // hard cast but we'll convert when we switch to useChat later
  return filterOutSystemMessages(messages as unknown as Message[]);
};

const filterOutSystemMessages = (messages: Message[]): Message[] => {
  return messages.filter((message) => message.role !== 'system');
};

export const getChatHistoryForGroup = async (
  group: string
): Promise<WonkReturnObject<ChatHistoryTitleEntry[]>> => {
  const session = (await auth()) as WonkSession;

  if (!session || !session.userId) {
    return WonkUnauthorized();
  }

  const userId = session.userId;

  const chats = await prisma.chats.findMany({
    where: {
      userId,
      active: true,
      group,
    },
    orderBy: {
      timestamp: 'desc',
    },
    select: {
      id: true,
      title: true,
      group: true,
      timestamp: true,
    },
  });

  return WonkSuccess(chats);
};

export const getChatHistory = async (): Promise<
  WonkReturnObject<ChatHistoryTitleEntry[]>
> => {
  const session = (await auth()) as WonkSession;

  if (!session || !session.userId) {
    return WonkUnauthorized();
  }

  const userId = session.userId;

  const chats = await prisma.chats.findMany({
    where: {
      userId,
      active: true,
    },
    orderBy: {
      timestamp: 'desc',
    },
    select: {
      id: true,
      group: true,
      title: true,
      timestamp: true,
    },
  });

  return WonkSuccess(chats);
};

/**
 * Gets a specific chat for the authenticated user.
 * Assumes the user is authenticated. Throws an error if the chat is not found or the user is not authorized.
 * @returns Chat object, with messages filtered to remove system messages.
 */
export const getChat = async (
  chatId: string
): Promise<WonkReturnObject<ChatHistory>> => {
  const session = (await auth()) as WonkSession;
  const userId = session.userId;
  if (!userId) {
    return WonkUnauthorized();
  }

  const chat = await prisma.chats.findUnique({
    where: {
      id: chatId,
      userId,
      active: true, // Only get active chats
    },
  });

  if (!chat) {
    return WonkNotFound();
  }

  return WonkSuccess({
    ...chat,
    messages: filterAndConvertMessages(chat.messages),
    meta: chat.meta as ChatHistoryMetadata,
  });
};

export const getSharedChat = async (
  shareId: string
): Promise<WonkReturnObject<ChatHistory>> => {
  const session = (await auth()) as WonkSession;
  const userId = session.userId;

  if (!userId) {
    return WonkUnauthorized();
  }

  const chat = await prisma.chats.findFirst({
    where: {
      shareId: shareId,
      active: true, // Only get active chats
    },
  });

  if (!chat) {
    return WonkNotFound();
  }

  return WonkSuccess({
    ...chat,
    messages: filterAndConvertMessages(chat.messages),
    meta: chat.meta as ChatHistoryMetadata,
  });
};

// save chats to db
// TODO: we are calling this in actions.tsx, is it save to pass in the entire chat and use directly?
export const saveChat = async (
  // session: Session,
  chatId: string,
  messages: Message[],
  group: string,
  focus: Focus
): Promise<WonkReturnObject<boolean>> => {
  const session = (await auth()) as WonkSession;
  const userId = session.userId;

  if (!userId) {
    return WonkUnauthorized();
  }

  // TODO: might be fun to use chatGPT to generate a title, either now or later when loading back up, or async
  const title =
    messages.find((m) => m.role === 'user')?.content.substring(0, 100) ??
    'New Chat';
  const chat: ChatHistory = {
    id: chatId,
    active: true,
    assistantSlug: POLICY_ASSISTANT_SLUG,
    title,
    messages,
    group,
    meta: {
      focus,
    },
    llmModel,
    userId: userId,
    timestamp: new Date(),
  };

  const newChat = await prisma.chats.create({
    data: {
      ...chat,
      messages: messages as unknown as InputJsonValue, // hack for now until we switch to useChat
    },
  });

  if (!newChat) {
    return WonkServerError();
  }

  // also log to elastic for now
  await logMessages(chatId, messages);

  return WonkSuccess(true);
};

export const saveReaction = async (
  chatId: string,
  reaction: Feedback
): Promise<WonkReturnObject<boolean>> => {
  const session = (await auth()) as WonkSession;
  const userId = session.userId;

  if (!userId) {
    return WonkUnauthorized();
  }

  // 1. Find the chat first to ensure it exists and belongs to the user
  const chat = await prisma.chats.findFirst({
    where: {
      id: chatId,
      userId: userId,
      active: true,
    },
    select: { meta: true }, // Select only meta to update it
  });

  if (!chat) {
    return WonkNotFound();
  }
  // 2. Update the chat with the new reaction in the meta field
  const currentMeta =
    chat.meta && typeof chat.meta === 'object' && !Array.isArray(chat.meta)
      ? chat.meta
      : {};
  const updatedMeta = { ...currentMeta, reaction: reaction };

  const updatedChat = await prisma.chats.update({
    where: {
      id: chatId,
      // No need for userId here again as we checked ownership above
    },
    data: {
      meta: updatedMeta as JsonObject, // Update the meta field
    },
    select: { id: true }, // Select minimal fields
  });

  if (!updatedChat) {
    // Should not happen if findFirst succeeded, but check anyway
    return WonkServerError();
  }

  // also log to elastic for now
  await logReaction(chatId, reaction);

  return WonkSuccess(true);
};

export const saveShareChat = async (
  chatId: string
): Promise<WonkReturnObject<string>> => {
  const session = (await auth()) as WonkSession;
  const userId = session.userId;

  if (!userId) {
    return WonkUnauthorized();
  }

  const chat = await prisma.chats.findFirst({
    where: { id: chatId, userId: userId, active: true },
    select: { id: true, shareId: true }, // Check if already shared
  });

  if (!chat) {
    return WonkNotFound();
  }

  // 2. Generate shareId and update
  const shareId = nanoid(); // Generate unique ID

  const updatedChat = await prisma.chats.update({
    where: {
      id: chatId,
    },
    data: {
      shareId: shareId,
    },
    select: { shareId: true }, // Select the updated shareId
  });

  if (!updatedChat || !updatedChat.shareId) {
    return WonkServerError();
  }

  return WonkSuccess(updatedChat.shareId);
};

export const removeShareChat = async (
  chatId: string
): Promise<WonkReturnObject<boolean>> => {
  const session = (await auth()) as WonkSession;
  const userId = session.userId;

  if (!userId) {
    return WonkUnauthorized();
  }

  // 1. Verify chat existence and ownership
  const chat = await prisma.chats.findFirst({
    where: { id: chatId, userId: userId, active: true },
    select: { id: true },
  });

  if (!chat) {
    // If not found or not owned, maybe it's already unshared or deleted.
    // Return success or NotFound depending on desired behavior. Let's return NotFound.
    return WonkNotFound();
  }

  // 2. Update the chat, setting shareId to null
  const updatedChat = await prisma.chats.update({
    where: {
      id: chatId,
    },
    data: {
      shareId: null, // Set shareId to null
    },
    select: { id: true }, // Minimal selection
  });

  if (!updatedChat) {
    return WonkServerError();
  }

  return WonkSuccess(true);
};

export const removeChat = async (
  chatId: string
): Promise<WonkReturnObject<boolean>> => {
  const session = (await auth()) as WonkSession;
  const userId = session.userId;

  if (!userId) {
    return WonkUnauthorized();
  }

  // 1. Verify chat existence and ownership *before* updating
  // Use updateMany for potentially slightly better performance if we don't need the record first
  const result = await prisma.chats.updateMany({
    where: {
      id: chatId,
      userId: userId,
      active: true, // Only affect active chats
    },
    data: {
      active: false, // Set active to false
    },
  });

  // updateMany returns a count of affected records
  if (result.count === 0) {
    // This means no chat matched the criteria (id, userId, active: true)
    // It might already be inactive, deleted, or belong to another user.
    // Return NotFound as the active chat wasn't found for this user.
    return WonkNotFound();
  }

  // If count > 0, the update was successful
  return WonkSuccess(true);
};
