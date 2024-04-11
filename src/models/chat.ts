import { Message } from 'ai';

export const defaultLlmModel = 'gpt-3.5-turbo';

export type ChatHistory = {
  id: string;
  title: string;
  messages: Message[];
  llmModel: string;
  user: string;
  userId: string;
  reaction?: string;
  timestamp: number;
};

export type UIState = {
  id: string;
  display: React.ReactNode;
}[];

export type PolicyIndex = {
  text: string;
  metadata: PolicyMetadata;
  vector: number[];
};

export type PolicyMetadata = {
  title: string;
  filename: string;
  effective_date: string;
  issuance_date: string;
  url: string;
  responsible_office: string | null;
  keywords: string[];
  classifications: string[];
  subject_areas: string[];
  hash: string;
  scope: string;
};
