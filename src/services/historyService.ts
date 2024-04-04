'use server';
import { Message } from 'ai';
import { MongoClient } from 'mongodb';
import { Session } from 'next-auth';

import { auth } from '@/auth';
import { ChatSession } from '@/models/chat';

import { logMessages, logReaction } from './loggingService';

const llmModel = process.env.OPENAI_LLM_MODEL ?? 'gpt-3.5-turbo';

const mongoConnectionString = process.env.MONGO_CONNECTION ?? '';

// save chats to db
export const saveChat = async (chatId: string, messages: Message[]) => {
  const session = (await auth()) as Session;

  // TODO: might be fun to use chatGPT to generate a title, either now or later when loading back up, or async
  const title =
    messages.find((m) => m.role === 'user')?.content ?? 'Unknown Title';
  const chat: ChatSession = {
    id: chatId,
    title,
    messages,
    llmModel,
    user: session.user?.name ?? 'Unknown User',
    userId: session.user?.id ?? 'Unknown User',
  };

  const client = await MongoClient.connect(mongoConnectionString);

  var db = client.db('policywonk');
  await db.collection('chats').insertOne(chat);

  // also log to elastic for now
  await logMessages(chatId, messages);
};

export const saveReaction = async (chatId: string, reaction: string) => {
  const client = await MongoClient.connect(mongoConnectionString);

  var db = client.db('policywonk');
  await db.collection('chats').updateOne(
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
