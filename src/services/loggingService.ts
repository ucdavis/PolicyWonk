'use server';
import { Client, ClientOptions, errors } from '@elastic/elasticsearch';
import { Message } from 'ai';
import { Session } from 'next-auth';

import { auth } from '@/auth';

const llmModel = process.env.OPENAI_LLM_MODEL ?? 'gpt-3.5-turbo';

// get my vector store
const config: ClientOptions = {
  node: process.env.ELASTIC_URL ?? 'http://127.0.0.1:9200',
  auth: {
    username: process.env.ELASTIC_WRITE_USERNAME ?? 'policylogger',
    password: process.env.ELASTIC_WRITE_PASSWORD ?? 'changeme',
  },
};

const searchClient: Client = new Client(config);

const indexName = process.env.ELASTIC_LOG_INDEX ?? 'test_vectorstore_app_logs';

let logIndexExists = false;

/**
 * Ensures that the log index exists in the Elasticsearch cluster.
 */
const ensureLogIndexExists = async () => {
  if (logIndexExists) {
    return; // only check once
  }

  const indexExists = await searchClient.indices.exists({ index: indexName });

  if (indexExists) {
    logIndexExists = true;
    return;
  }

  // ensure the index exists
  await searchClient.indices.create({
    index: indexName,
    body: {
      mappings: {
        properties: {
          user: { type: 'keyword' },
          llm_model: { type: 'keyword' },
          reaction: { type: 'keyword' },
          timestamp: { type: 'date' },
          messages: {
            type: 'nested', // Using nested type for the array of objects
            properties: {
              // Define properties for each object in the array
              id: { type: 'keyword' }, // Unique identifier for the message
              role: { type: 'keyword' }, // Role of the entity sending the message (e.g., 'user', 'bot')
              content: { type: 'text' }, // The actual message content
            },
          },
          metadata: {
            type: 'object', // Using object type for arbitrary key/value pairs
            enabled: true, // Default is true, explicitly setting for clarity
            dynamic: true, // Allows arbitrary fields to be indexed without pre-defining them
          },
        },
      },
    },
  });

  logIndexExists = true;
};

export const logMessages = async (chatId: string, messages: Message[]) => {
  const session = (await auth()) as Session;

  const user = session?.user?.name ?? 'Unknown User';

  await logResponse(chatId, messages, llmModel, user);
};

// use elasticsearch to log the user's query and the results
export const logResponse = async (
  id: string,
  messages: Message[],
  model: string,
  user: string
) => {
  // TODO: run only once on startup
  await ensureLogIndexExists();

  const chatLog: ChatLog = {
    user,
    llm_model: model,
    timestamp: new Date(),
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
    })),
    reaction: '',
    metadata: {
      vector: 'Elastic dense vector + cosine',
      chunk_strategy: 'recursive, large chunks',
    },
  };
  // log the query and the results to elasticsearch
  await searchClient.index({
    index: indexName,
    id,
    body: chatLog,
  });
};

/**
 * Logs a reaction for a given ID.
 * @param id - The ID of the item to log the reaction for.
 * @param reaction - The reaction to log.
 */
export const logReaction = async (id: string, reaction: string) => {
  await searchClient.update({
    index: indexName,
    id,
    body: {
      doc: {
        reaction,
      },
    },
  });
};

// Defining a generic type for metadata to allow any structure of key/value pairs
interface Metadata {
  [key: string]: any; // Use `any` or a more specific type if known structure
}

interface ChatLog {
  user: string; // User as a string
  llm_model: string; // LLM model used for the chat session
  reaction: string; // User's reaction or empty
  timestamp: Date; // Timestamp for when the log was created
  messages: Message[]; // Array of Message objects
  metadata: Metadata; // Flexible key/value pairs for arbitrary metadata
}
