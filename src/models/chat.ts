import { Message } from 'ai';

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  llmModel: string;
  user: string;
  userId: string;
  reaction?: string;
};
