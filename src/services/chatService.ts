'use server';
import { Client, ClientOptions } from '@elastic/elasticsearch';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';
import { Message } from 'ai';
import OpenAI from 'openai';

const embeddingModel =
  process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-large';

// API key is stored in env
const openai = new OpenAI();

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

export const getChatMessages = async (query: string) => {
  // Perform our RAG pipeline and send the message to the server so it can generate a response
  // 1. get embeddings
  // 2. get search results from elastic
  // 3. generate a LLM message
  // 4. return the message
  const embeddings = await getEmbeddings(query);

  const searchResults = await getSearchResults(embeddings);

  const transformedResults = expandedTransformSearchResults(searchResults);

  const systemMessage = getSystemMessage(transformedResults);

  const initialMessages: Message[] = [
    systemMessage, // system message with full document info
    {
      id: '2',
      role: 'user',
      content: query,
    },
  ];

  return initialMessages;
};

const getEmbeddings = async (query: string) => {
  // get our embeddings
  const embeddings = await openai.embeddings.create({
    model: embeddingModel, // needs to be the same model as we used to index
    input: query,
  });

  return embeddings;
};

const getSearchResults = async (
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

const expandedTransformSearchResults = (
  searchResults: SearchResponse<PolicyIndex>
) => {
  // doc format
  //   Document: 0
  // title: Tall penguins
  // text: Emperor penguins are the tallest growing up to 122 cm in height.

  // For now, if the same document is returned >1, we'll just concatenate the text. This way we only get a single reference per document.
  // eventually we might want to keep them as separate references w/ different line number ranges, or pull in full or expanded text

  // get all docs -- source should never be undefined but we'll filter just in case
  const allResults: PolicyIndex[] = searchResults.hits.hits
    .map((h) => h._source)
    .filter((r): r is PolicyIndex => r !== undefined);

  const resultMap: Map<string, PolicyIndex> = new Map();

  allResults.forEach((result) => {
    const {
      metadata: { hash },
      text,
    } = result;

    if (resultMap.has(hash)) {
      // If hash is already in the Map, concat the new text to the existing text.
      const existingEntry = resultMap.get(hash)!;
      existingEntry.text += `\n\n${text}`;
    } else {
      // Else, just add the new entry to the Map.
      resultMap.set(hash, { ...result });
    }
  });

  const uniqueResults: PolicyIndex[] = Array.from(resultMap.values());

  // format the results
  return uniqueResults
    .map((hit: PolicyIndex, i: number) => {
      return `\nDocument: ${i}\ntitle: ${cleanupTitle(hit.metadata.title)}\nurl: ${hit.metadata.url}\ntext: ${hit.text}`;
    })
    .join('\n\n');
};

const cleanupTitle = (title: string) => {
  // replace any quotes
  return title.replace(/"/g, '');
};

const getSystemMessage = (docText: string) => {
  return {
    id: '1',
    role: 'system',
    content: `
    ## Basic Rules
You are a helpful assistant who is an expert in university policy at UC Davis. When you answer the user's requests, you cite your sources in your answers, according to the provided instructions. Always respond in well-formatted markdown.

# User Preamble
## Task and Context
You help people answer their policy questions interactively. You should focus on serving the user's needs as best you can.

## Style Guide
Unless the user asks for a different style of answer, you should answer in full sentences, using proper grammar and spelling.

## Document context
<documents>
${docText}
</documents>

Carefully perform the following instructions, in order, starting each with a new line.
Write a response to the user's last input in high quality natural english. Use the symbols [^doctitle] to indicate when a fact comes from a document in the search result, e.g ""my fact [^doc1]"" for a fact from document "doc1".
Finally, Write 'Citation(s):' followed the citations for the facts you used in your response. Use the same symbols [^doctitle]: to indicate which document the fact came from, e.g. ""[^doc1]: [doc1](document url)"" for a fact from document "doc1". Do not put the citations in a list ('-') format.
`,
  } as Message;
};

type PolicyIndex = {
  text: string;
  metadata: PolicyMetadata;
  vector: number[];
};

type PolicyMetadata = {
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
