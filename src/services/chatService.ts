'server only';
import { Client, ClientOptions } from '@elastic/elasticsearch';
import {
  KnnQuery,
  QueryDslQueryContainer,
  SearchResponse,
} from '@elastic/elasticsearch/lib/api/types';
import { Message } from 'ai';
import OpenAI from 'openai';

import { PolicyIndex } from '@/models/chat';
import { Focus, FocusScope } from '@/models/focus';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const llmModel = process.env.OPENAI_LLM_MODEL ?? 'gpt-3.5-turbo';

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

export const getEmbeddings = async (query: string) => {
  // get our embeddings
  const embeddings = await openai.embeddings.create({
    model: embeddingModel, // needs to be the same model as we used to index
    input: query,
  });

  return embeddings;
};

const generateFilter = (
  focus: Focus
): QueryDslQueryContainer | QueryDslQueryContainer[] => {
  let allowedScopes: FocusScope[] = [];

  if (focus.name === 'core') {
    allowedScopes = [
      'ucop',
      'ucdppm',
      'ucdppsm',
      'ucddelegation',
      'ucdinterim',
    ];

    return {
      terms: {
        'metadata.scope.keyword': allowedScopes,
      },
    };
  } else if (focus.name === 'apm') {
    allowedScopes = ['ucdapm'];

    return {
      terms: {
        'metadata.scope.keyword': allowedScopes,
      },
    };
  } else if (focus.name === 'unions') {
    allowedScopes = ['collective_bargaining_contracts'];

    // for unions we need to read the subfocus
    if (focus.subFocus) {
      // we could add more scopes here if we wanted to filter further
      // but for now we'll just match the subfocus
      return {
        bool: {
          must: [
            {
              terms: {
                'metadata.keywords.keyword': [
                  focus.subFocus.toLocaleUpperCase(),
                ],
              },
            },
            {
              terms: {
                'metadata.scope.keyword': allowedScopes,
              },
            },
          ],
        },
      };
    }
  } else if (focus.name === 'knowledgebase') {
    allowedScopes = ['ucdknowledgebase'];

    return {
      terms: {
        'metadata.scope.keyword': allowedScopes,
      },
    };
  }

  // match nothing since we don't know what to do
  return {
    match_none: {},
  };
};

export const getSearchResults = async (
  embeddings: OpenAI.Embeddings.CreateEmbeddingResponse,
  focus: Focus
) => {
  const searchResultMaxSize = 5;

  const filter = generateFilter(focus);

  // TODO: augment search w/ keyword search?
  // get our search results

  const knnQuery: KnnQuery = {
    field: 'vector', // the field we want to search, created by PolicyAcquisition
    query_vector: embeddings.data[0].embedding, // the query vector
    k: searchResultMaxSize,
    num_candidates: 200,
    filter,
  };

  const searchResults = await searchClient.search<PolicyIndex>({
    index: indexName,
    size: searchResultMaxSize,
    body: {
      knn: knnQuery,
    },
  });

  // Note: if we want >1 fileter, we can add a bool -> must -> terms[]

  return searchResults;
};

export const expandedTransformSearchResults = (
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

export const getSystemMessage = (docText: string) => {
  return {
    id: '1',
    role: 'system',
    content: `
    ## Basic Rules
You are a helpful assistant who is an expert in university policy at UC Davis. When you answer the user's requests, you cite your sources in your answers, according to the provided instructions. Always respond in well-formatted markdown.

# User Preamble
## Task and Context
You help people answer their policy questions interactively. You should focus on serving the user's needs as best you can. If you don't know the answer, respond only with "Sorry, I couldn't find enough information to answer your question".

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
