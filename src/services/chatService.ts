import { Client, ClientOptions } from '@elastic/elasticsearch';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';
import { Message } from 'ai';
import OpenAI from 'openai';

import { PolicyIndex } from '@/models/chat';

const embeddingModel =
  process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-large';

// get my vector store
const config: ClientOptions = {
  node: process.env.ELASTIC_URL ?? 'http://127.0.0.1:9200',
  auth: {
    username: process.env.ELASTIC_SEARCHER_USERNAME ?? 'elastic',
    password: process.env.ELASTIC_SEARCHER_PASSWORD ?? 'changeme',
  },
};

const searchClient: Client = new Client(config);

const indexName = process.env.ELASTIC_INDEX ?? 'test_vectorstore4';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const getEmbeddings = async (query: string) => {
  // get our embeddings
  const embeddings = await openai.embeddings.create({
    model: embeddingModel, // needs to be the same model as we used to index
    input: query,
  });

  return embeddings;
};

export const getSearchResults = async (
  embeddings: OpenAI.Embeddings.CreateEmbeddingResponse
) => {
  const searchResultMaxSize = 5;

  // TODO: augment search w/ keyword search, or perhaps follow up questions?
  // get our search results
  const searchResults = await searchClient.search<PolicyIndex>({
    index: indexName,
    size: searchResultMaxSize,
    body: {
      knn: {
        field: 'vector', // the field we want to search, created by PolicyAcquisition
        query_vector: embeddings.data[0].embedding, // the query vector
        k: searchResultMaxSize,
        num_candidates: 200,
      },
    },
  });

  return searchResults;
};

export const transformSearchResults = (
  searchResults: SearchResponse<PolicyIndex>
) => {
  // Each document should be delimited by triple quotes and then note the excerpt of the document
  const docTextArray = searchResults.hits.hits.map((hit: any) => {
    return `"""${hit._source.text}\n\n-from [${cleanupTitle(hit._source.metadata.title)}](${hit._source.metadata.url})"""`;
  });

  return docTextArray.join('\n\n');
};

const cleanupTitle = (title: string) => {
  // replace any quotes
  return title.replace(/"/g, '');
};

export const getSystemMessage = (docText: string) => {
  return {
    id: '1',
    role: 'system',
    content: `
    You are a helpful assistant who is an expert in university policy at UC Davis. You will be provided with several documents each delimited by triple quotes and then asked a question.
  Your task is to answer the question in nicely formatted markdown using only the provided documents and to cite the the documents used to answer the question. 
  If the documents do not contain the information needed to answer this question then simply write: "Sorry, I wasn't able to find enough information to answer this question." 
  If an answer to the question is provided, it must be annotated with a citation including the source URL and title. \n\n ${docText}`,
  } as Message;
};
