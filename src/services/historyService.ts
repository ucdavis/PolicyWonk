'use server';
import { Message } from 'ai';
import { MongoClient, WithId } from 'mongodb';
import { nanoid } from 'nanoid';
import { Session } from 'next-auth';

import { auth } from '@/auth';
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

export const getChat = async (chatId: string, userId: string) => {
  const chatsDb = await getChatsCollection();

  const queryFilter: Partial<ChatHistory> = {
    id: chatId,
    userId: userId,
    active: true,
  };

  const chat = await chatsDb.findOne(queryFilter);

  if (!chat) {
    return null;
  }

  chat.messages = chat.messages.filter((m) => m.role !== 'system');

  return unwrapChat(chat);
};

export const getSharedChat = async (shareId: string) => {
  const chatsDb = await getChatsCollection();

  const queryFilter: Partial<ChatHistory> = {
    shareId: shareId,
    active: true,
  };

  const chat = await chatsDb.findOne(
    queryFilter,
    { projection: { _id: 0, feedback: 0 } } // we don't need feedback for shared chats + unwrap chats
  );

  if (!chat) {
    return null;
  }

  chat.messages = chat.messages.filter((m) => m.role !== 'system');

  return chat;
};

export const getChatHistory = async (userId: string) => {
  const chatsDb = await getChatsCollection();

  const queryFilter: Partial<ChatHistory> = {
    userId: userId,
    active: true,
  };

  const chats = (await chatsDb
    .find(queryFilter)
    .project({ messages: 0, _id: 0 }) // we don't need messages for the history + unwrap chats
    .sort({ timestamp: -1 })
    .toArray()) as ChatHistory[];

  return chats;
};

// save chats to db
// TODO: we are calling this in actions.tsx, is it save to pass in the entire chat and use directly?
export const saveChat = async (
  chatId: string,
  messages: Message[],
  focus: Focus
) => {
  const session = (await auth()) as Session;
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
    user: session.user?.name ?? 'Unknown User',
    userId: session.user?.id ?? 'Unknown User',
    timestamp: Date.now(),
  };

  const chatsDb = await getChatsCollection();
  await chatsDb.insertOne(chat);

  // also log to elastic for now
  await logMessages(chatId, messages);
};

export const saveReaction = async (chatId: string, reaction: Feedback) => {
  const session = (await auth()) as Session;
  const chatsDb = await getChatsCollection();

  const queryFilter: Partial<ChatHistory> = {
    id: chatId,
    userId: session.user?.id,
    active: true,
  };

  const res = await chatsDb.updateOne(queryFilter, {
    $set: {
      reaction,
    },
  });
  if (res.modifiedCount === 0) {
    return; // TODO: throw error
  }
  // also log to elastic for now
  await logReaction(chatId, reaction);
};

export const saveShareChat = async (chatId: string) => {
  const session = (await auth()) as Session;
  const chatsDb = await getChatsCollection();

  const queryFilter: Partial<ChatHistory> = {
    id: chatId,
    userId: session.user?.id,
    active: true,
  };

  const chat = await chatsDb.findOne(queryFilter);

  if (!chat) {
    return;
  }
  const shareId = nanoid();
  const res = await chatsDb.updateOne(queryFilter, {
    $set: {
      shareId,
    },
  });
  if (res.modifiedCount === 0) {
    return; // TODO: throw error
  }

  return shareId;
};

export const removeShareChat = async (chatId: string) => {
  const session = (await auth()) as Session;
  const chatsDb = await getChatsCollection();

  const queryFilter: Partial<ChatHistory> = {
    id: chatId,
    userId: session.user?.id,
    active: true,
  };

  const res = await chatsDb.updateOne(queryFilter, {
    $unset: {
      shareId: '',
    },
  });
  if (res.modifiedCount === 0) {
    return; // TODO: throw error
  }

  return;
};

export const removeChat = async (chatId: string) => {
  const session = (await auth()) as Session;
  const chatsDb = await getChatsCollection();

  const queryFilter: Partial<ChatHistory> = {
    id: chatId,
    userId: session.user?.id,
    active: true,
  };

  const res = await chatsDb.updateOne(queryFilter, {
    $set: {
      active: false,
    },
  });
  if (res.modifiedCount === 0) {
    return; // TODO: throw error
  }

  return;
};
