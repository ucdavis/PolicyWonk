import { Client, ClientOptions } from '@elastic/elasticsearch';
import { Message } from 'ai';

// get my vector store
const config: ClientOptions = {
  node: process.env.ELASTIC_URL ?? 'http://127.0.0.1:9200',
  auth: {
    username: process.env.ELASTIC_SEARCHER_USERNAME ?? 'elastic',
    password: process.env.ELASTIC_SEARCHER_PASSWORD ?? 'changeme',
  },
};

const searchClient: Client = new Client(config);

const indexName = process.env.ELASTIC_LOG_INDEX ?? 'test_vectorstore_logs';

/**
 * Ensures that the log index exists in the Elasticsearch cluster.
 */
export const ensureLogIndexExists = async () => {
  const indexExists = await searchClient.indices.exists({ index: indexName });

  if (indexExists) {
    console.log(`Index ${indexName} already exists.`);
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
        },
      },
    },
  });

  console.log(`Index ${indexName} created.`);
};

// use elasticsearch to log the user's query and the results
export const logResponse = async (
  id: string,
  messages: Message[],
  model: string,
  user: string
) => {
  // log the query and the results to elasticsearch
  await searchClient.index({
    index: indexName,
    id,
    body: {
      user,
      llm_model: model,
      timestamp: new Date(),
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      })),
    },
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
