'use server';
import { Message } from 'ai';
import { MongoClient, WithId } from 'mongodb';
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

  const chat = await chatsDb.findOne({ id: chatId, userId: userId });

  if (!chat) {
    return null;
  }

  // TODO: skip pulling system message to begin with
  chat.messages = chat.messages.filter((m) => m.role !== 'system');

  return unwrapChat(chat);
};

export const getChatHistory = async (userId: string) => {
  const chatsDb = await getChatsCollection();

  const chats = (await chatsDb
    .find({ userId: userId })
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

  const res = await chatsDb.updateOne(
    { id: chatId, userId: session.user?.id },
    {
      $set: {
        reaction,
      },
    }
  );
  if (res.modifiedCount === 0) {
    return;
  }
  // also log to elastic for now
  await logReaction(chatId, reaction);
};
