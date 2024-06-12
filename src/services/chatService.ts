'server only';
import { Client, ClientOptions } from '@elastic/elasticsearch';
import {
  KnnQuery,
  QueryDslQueryContainer,
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

  // transform the results
  const allResults: PolicyIndex[] = searchResults.hits.hits
    .map((h, i) => ({
      ...h._source,
      id: h._id,
      docNumber: i,
    }))
    .filter((r): r is PolicyIndex => r !== undefined);

  return allResults;
};

export const expandedTransformSearchResults = (
  searchResults: PolicyIndex[]
) => {
  // doc format
  // Document: 0
  // text: Emperor penguins are the tallest growing up to 122 cm in height.

  // For now, if the same document is returned >1, we'll just concatenate the text. This way we only get a single reference per document.
  // eventually we might want to keep them as separate references w/ different line number ranges, or pull in full or expanded text
  const resultMap: Map<string, PolicyIndex> = new Map();

  searchResults.forEach((result) => {
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
      return `\nDocument: ${hit.docNumber}\ntext: ${hit.text}`;
    })
    .join('\n\n');
};

export const transformContentWithCitations = (
  docText: string,
  policies: PolicyIndex[]
) => {
  // our content contains citations in the form <c:1234>
  // we need to replace those w/ markdown citations
  // markdown citations replace inline in the form of [^1]
  // and then at the bottom of the document we have [^1]: [citation title](citation url)

  // 1. find all citations in the text
  const citations = docText.match(/<c:\d+>/g) ?? [];

  // if there are no citations, we don't need to do anything
  if (citations.length === 0) {
    return docText;
  }

  // 2. replace the citations in the text w/ markdown citations and keep track of the citations
  const usedCitationDocNums = new Set<number>();

  let transformedText = docText;
  citations.forEach((c, i) => {
    // get the number
    const number = c.match(/\d+/)?.[0] ?? '';

    // add the number to the set if it is a number
    const num = parseInt(number);
    if (!isNaN(num)) {
      usedCitationDocNums.add(num);
    }

    // replace the citation in the text
    transformedText = transformedText.replace(c, `[^${number}]`);
  });

  // 3. create the markdown citations footnote now that we know which citations are used
  const usedPolicies = policies.filter((p) =>
    usedCitationDocNums.has(p.docNumber)
  );

  const citationFootnoteMarkdown = usedPolicies
    .map((p) => {
      return `[^${p.docNumber}]: [${p.metadata.title}](${p.metadata.url})`;
    })
    .join('\n');

  // 4. add the citations to the end of the document
  transformedText += `\n\n## Citations\n${citationFootnoteMarkdown}\n`;

  return transformedText;
};

export const getSystemMessage = (docText: string) => {
  return {
    id: '1',
    role: 'system',
    content: `
    ## Basic Rules
You are a helpful assistant who is an expert in university policy at UC Davis. When you answer the user's requests, you cite your sources in your answers, according to the provided instructions. Always respond in well-formatted markdown.
## Task and Context
You help people answer their policy questions interactively. You should focus on serving the user's needs as best you can. If you don't know the answer, respond only with "Sorry, I couldn't find enough information to answer your question".
## Style Guide
Unless the user asks for a different style of answer, you should answer in full sentences, using proper grammar and spelling.

## Document context
<documents>
${docText}
</documents>

Write a response to the user's last input in high quality natural english. Use the symbol <c:id> to indicate when a fact comes from a document in the search result. 
e.g ""my fact <c:0>"" for a fact from "Document: 0" or ""external citation <c:2>"" for a fact from "Document: 2".
`,
  } as Message;
};
