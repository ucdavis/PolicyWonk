import { Message } from 'ai';

import { llmModel } from '../services/chatService';

import { Focus, focuses } from './focus';

export type ChatHistoryMetadata = {
  focus: Focus;
};

export type ChatHistory = {
  id: string;
  active: boolean;
  title: string;
  messages: Message[];
  meta: ChatHistoryMetadata;
  assistantSlug: string;
  group: string;
  llmModel: string;
  userId: number;
  reaction?: Feedback;
  timestamp: Date;
  shareId?: string | null;
};

export const blankAIState: ChatHistory = {
  id: '', // don't use nanoid() here so we make sure to generate a new id when we create a new chat
  title: '',
  messages: [],
  assistantSlug: 'policywonk',
  meta: {
    focus: focuses[0],
  },
  group: 'ucdavis',
  llmModel: llmModel,
  userId: 0,
  reaction: undefined,
  timestamp: new Date(),
  shareId: undefined,
  active: true,
};

export type Feedback = 'thumbs_up' | 'thumbs_down';

export type UIStateNode = {
  id: string;
  display: React.ReactNode;
};

export type UIState = UIStateNode[];

export type PolicyIndex = {
  id: string;
  docNumber: number;
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
