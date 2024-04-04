'use server';
import { Message } from 'ai';
import { Session } from 'next-auth';

import { auth } from '@/auth';
import { ChatSession } from '@/models/chat';

import { logMessages } from './loggingService';

const llmModel = process.env.OPENAI_LLM_MODEL ?? 'gpt-3.5-turbo';

// save chats to db
export const saveChat = async (chatId: string, messages: Message[]) => {
  const session = (await auth()) as Session;

  const chat: ChatSession = {
    id: chatId,
    messages,
    llmModel,
    user: session.user?.name ?? 'Unknown User',
    userId: session.user?.id ?? 'Unknown User',
  };

  console.log('Saving chat', chat);

  // also log to elastic for now
  await logMessages(chatId, messages);
};
