'use server';
import { Message } from 'ai';
import { MongoClient, WithId } from 'mongodb';
import { nanoid } from 'nanoid';
import { Session } from 'next-auth';

import { auth } from '@/auth';
import {
  WonkNotFound,
  WonkReturnObject,
  WonkForbidden,
  WonkUnauthorized,
  WonkSuccess,
  WonkServerError,
} from '@/lib/error/error';
import { ChatHistory, Feedback } from '@/models/chat';
import { Focus } from '@/models/focus';

import { llmModel } from './chatService';
import { logMessages, logReaction } from './loggingService';

const mongoConnectionString = process.env.MONGO_CONNECTION ?? '';
const mongoDbName = process.env.MONGO_DB ?? 'policywonk';
const mongoCollectionName = process.env.MONGO_COLLECTION ?? 'chats';

let _mongoClient: MongoClient;
// TODO: separate out into actions and service

// all of our chats are stored in the "policywonk" db in the "chats" collection
async function getChatsCollection() {
  if (_mongoClient) {
    return _mongoClient
      .db(mongoDbName)
      .collection<ChatHistory>(mongoCollectionName);
  }

  // otherwise create a new one and make sure indexes are setup
  _mongoClient = new MongoClient(mongoConnectionString);
  const collection = _mongoClient
    .db(mongoDbName)
    .collection<ChatHistory>(mongoCollectionName);

  await collection.createIndex({ timestamp: -1 });

  return collection;
}

// mongo adds an unserilizable _id field to all objects, so we need to unwrap it
function unwrapChat(chatWithId: WithId<ChatHistory>): ChatHistory {
  const { _id, ...chat } = chatWithId;

  return chat;
}

/**
 * Assumes the user is authenticated. Throws an error if the chat is not found or the user is not authorized.
 * @returns ChatHistory for the chat, with messages filtered to remove system messages.
 */
export const getChat = async (
  chatId: string
): Promise<WonkReturnObject<ChatHistory>> => {
  const session = (await auth()) as Session;
  const userId = session?.user?.id;
  if (!userId) {
    return WonkUnauthorized();
  }

  const chatsDb = await getChatsCollection();

  const queryFilter: Partial<ChatHistory> = {
    id: chatId,
    active: true,
  };

  const chat = await chatsDb.findOne(queryFilter);

  if (!chat) {
    return WonkNotFound();
  }

  if (chat.userId !== userId) {
    return WonkForbidden();
  }

  chat.messages = chat.messages.filter((m) => m.role !== 'system');

  return WonkSuccess(unwrapChat(chat));
};

export const getSharedChat = async (
  shareId: string
): Promise<WonkReturnObject<ChatHistory>> => {
  const session = (await auth()) as Session;
  const userId = session?.user?.id;

  if (!userId) {
    return WonkUnauthorized();
  }

  const chatsDb = await getChatsCollection();

  const queryFilter: Partial<ChatHistory> = {
    shareId: shareId,
    active: true,
  };

  const chat = await chatsDb.findOne(
    queryFilter,
    { projection: { feedback: 0 } } // we don't need feedback for shared chats + unwrap chats
  );

  if (!chat) {
    return WonkNotFound();
  }

  chat.messages = chat.messages.filter((m) => m.role !== 'system');

  return WonkSuccess(unwrapChat(chat));
};

export const getChatHistory = async (): Promise<
  WonkReturnObject<ChatHistory[]>
> => {
  const session = (await auth()) as Session;
  const userId = session?.user?.id;

  if (!userId) {
    return WonkUnauthorized();
  }

  const chatsDb = await getChatsCollection();

  const queryFilter: Partial<ChatHistory> = {
    userId,
    active: true,
  };

  const chats = (await chatsDb
    .find(queryFilter)
    .project({ messages: 0, _id: 0 }) // we don't need messages for the history + unwrap chats
    .sort({ timestamp: -1 })
    .toArray()) as ChatHistory[];

  return WonkSuccess(chats);
};

// save chats to db
// TODO: we are calling this in actions.tsx, is it save to pass in the entire chat and use directly?
export const saveChat = async (
  // session: Session,
  chatId: string,
  messages: Message[],
  focus: Focus
): Promise<WonkReturnObject<boolean>> => {
  const session = (await auth()) as Session;
  const user = session?.user;

  if (!user?.id) {
    return WonkUnauthorized();
  }

  // TODO: might be fun to use chatGPT to generate a title, either now or later when loading back up, or async
  const title =
    messages.find((m) => m.role === 'user')?.content ?? 'Unknown Title';
  const chat: ChatHistory = {
    id: chatId,
    active: true,
    title,
    messages,
    focus,
    llmModel,
    user: user.name ?? 'Unknown User',
    userId: user.id,
    timestamp: Date.now(),
  };

  const chatsDb = await getChatsCollection();
  const res = await chatsDb.insertOne(chat);
  if (!res.acknowledged) {
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
  const session = (await auth()) as Session;
  const userId = session?.user?.id;

  if (!userId) {
    return WonkUnauthorized();
  }

  const chatsDb = await getChatsCollection();

  const queryFilter: Partial<ChatHistory> = {
    id: chatId,
    userId,
    active: true,
  };

  const res = await chatsDb.updateOne(queryFilter, {
    $set: {
      reaction,
    },
  });
  if (res.modifiedCount === 0) {
    return WonkServerError();
  }
  // also log to elastic for now
  await logReaction(chatId, reaction);

  return WonkSuccess(true);
};

export const saveShareChat = async (
  chatId: string
): Promise<WonkReturnObject<string>> => {
  const session = (await auth()) as Session;
  const userId = session?.user?.id;

  if (!userId) {
    return WonkUnauthorized();
  }

  const chatsDb = await getChatsCollection();

  const queryFilter: Partial<ChatHistory> = {
    id: chatId,
    userId,
    active: true,
  };

  const chat = await chatsDb.findOne(queryFilter);

  if (!chat) {
    return WonkNotFound();
  }

  const shareId = nanoid();
  const res = await chatsDb.updateOne(queryFilter, {
    $set: {
      shareId,
    },
  });
  if (res.modifiedCount === 0) {
    return WonkServerError();
  }

  return WonkSuccess(shareId);
};

export const removeShareChat = async (
  chatId: string
): Promise<WonkReturnObject<boolean>> => {
  const session = (await auth()) as Session;
  const userId = session?.user?.id;

  if (!userId) {
    return WonkUnauthorized();
  }

  const chatsDb = await getChatsCollection();

  const queryFilter: Partial<ChatHistory> = {
    id: chatId,
    userId,
    active: true,
  };

  const res = await chatsDb.updateOne(queryFilter, {
    $unset: {
      shareId: '',
    },
  });
  if (res.modifiedCount === 0) {
    return WonkServerError();
  }

  return WonkSuccess(true);
};

export const removeChat = async (
  chatId: string
): Promise<WonkReturnObject<boolean>> => {
  const session = (await auth()) as Session;
  const userId = session?.user?.id;

  if (!userId) {
    return WonkUnauthorized();
  }

  const chatsDb = await getChatsCollection();

  const queryFilter: Partial<ChatHistory> = {
    id: chatId,
    userId,
    active: true,
  };

  const res = await chatsDb.updateOne(queryFilter, {
    $set: {
      active: false,
    },
  });
  if (res.modifiedCount === 0) {
    return WonkServerError();
  }

  return WonkSuccess(true);
};
