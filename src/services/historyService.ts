'use server';
import { Message } from 'ai';
import { MongoClient, WithId } from 'mongodb';
import { Session } from 'next-auth';

import { auth } from '@/auth';
import { ChatHistory, defaultLlmModel } from '@/models/chat';

import { logMessages, logReaction } from './loggingService';

const llmModel = process.env.OPENAI_LLM_MODEL ?? defaultLlmModel;

const mongoConnectionString = process.env.MONGO_CONNECTION ?? '';

let _mongoClient: MongoClient;

// all of our chats are stored in the "policywonk" db in the "chats" collection
async function getChatsCollection() {
  if (_mongoClient) {
    return _mongoClient.db('policywonk').collection<ChatHistory>('chats');
  }

  // otherwise create a new one and make sure indexes are setup
  _mongoClient = new MongoClient(mongoConnectionString);
  const collection = _mongoClient
    .db('policywonk')
    .collection<ChatHistory>('chats');

  await collection.createIndex({ timestamp: -1 });

  return collection;
}

// mongo adds an unserilizable _id field to all objects, so we need to unwrap it
function unwrapChat(chatWithId: WithId<ChatHistory>): ChatHistory {
  const { _id, ...chat } = chatWithId;

  return chat;
}

export const getChat = async (chatId: string) => {
  const session = (await auth()) as Session;

  const chatsDb = await getChatsCollection();

  const chat = await chatsDb.findOne({ id: chatId, userId: session.user?.id });

  return chat ? unwrapChat(chat) : null;
};

export const getChats = async (userId: string) => {
  const chatsDb = await getChatsCollection();

  const chats = await chatsDb
    .find({ userId: userId })
    .sort({ timestamp: -1 })
    .toArray();

  return chats;
};

// save chats to db
export const saveChat = async (chatId: string, messages: Message[]) => {
  const session = (await auth()) as Session;

  // TODO: might be fun to use chatGPT to generate a title, either now or later when loading back up, or async
  const title =
    messages.find((m) => m.role === 'user')?.content ?? 'Unknown Title';
  const chat: ChatHistory = {
    id: chatId,
    title,
    messages,
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

export const saveReaction = async (chatId: string, reaction: string) => {
  const chatsDb = await getChatsCollection();

  await chatsDb.updateOne(
    { id: chatId },
    {
      $set: {
        reaction,
      },
    }
  );

  // also log to elastic for now
  await logReaction(chatId, reaction);
};
