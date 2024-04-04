import { Message } from 'ai';

export type AIState = {
  chatId: string;
  messages: Message[];
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
