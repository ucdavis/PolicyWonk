import { Message } from 'ai';

export type ChatSession = {
  id: string;
  messages: Message[];
  llmModel: string;
  user: string;
  userId: string;
};
