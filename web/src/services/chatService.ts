'server only';
import { createOpenAI } from '@ai-sdk/openai';
import { Client, ClientOptions } from '@elastic/elasticsearch';
import { estypes } from '@elastic/elasticsearch';

import prisma from '@/lib/db';

import type { ChatMessage, PolicyIndex } from '../models/chat';
import { Focus, FocusScope } from '../models/focus';

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const llmModel = process.env.OPENAI_LLM_MODEL ?? 'gpt-5.2';

const embeddingModel = openai.embedding(
  process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-large'
);

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

export const getEmbeddings = async (query: string): Promise<number[][]> => {
  // get our embeddings
  const embeddings = await embeddingModel.doEmbed({
    values: [query],
  });

  return embeddings.embeddings;
};

const generateFilterElastic = (
  focus: Focus
): estypes.QueryDslQueryContainer | estypes.QueryDslQueryContainer[] => {
  let allowedScopes: FocusScope[] = [];

  const isV2 = indexName.includes('v2');
  const fieldName = isV2
    ? 'metadata.source_type.keyword'
    : 'metadata.scope.keyword';

  if (focus.name === 'core') {
    allowedScopes = isV2 ? ['UCOP', 'UCDPOLICYMANUAL'] : ['UCOP', 'UCDPOLICY'];

    return {
      terms: {
        [fieldName]: allowedScopes,
      },
    };
  } else if (focus.name === 'ucop') {
    allowedScopes = ['UCOP'];
    return {
      terms: {
        [fieldName]: allowedScopes,
      },
    };
  } else if (focus.name === 'apm') {
    allowedScopes = ['UCDAPM'];
    return {
      terms: {
        [fieldName]: allowedScopes,
      },
    };
  } else if (focus.name === 'unions') {
    allowedScopes = isV2 ? ['UCCONTRACTS'] : ['UCCOLLECTIVEBARGAINING'];

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
                [fieldName]: allowedScopes,
              },
            },
          ],
        },
      };
    }
  } else if (focus.name === 'knowledgebase') {
    allowedScopes = ['UCDKB'];

    return {
      terms: {
        [fieldName]: allowedScopes,
      },
    };
  }

  // match nothing since we don't know what to do
  return {
    match_none: {},
  };
};

export const getSearchResultsElastic = async (
  embeddings: number[][],
  focus: Focus,
  userInput: string
) => {
  const searchResultMaxSize = 5;
  const MAX_DOC_TOKENS = 20000;

  const filter = generateFilterElastic(focus);

  const baseTextQuery: estypes.QueryDslQueryContainer = {
    function_score: {
      query: {
        multi_match: {
          query: userInput,
          fields: ['metadata.title', 'metadata.keywords', 'text'],
        },
      },
      boost_mode: 'multiply' as const,
      score_mode: 'multiply' as const,
    },
  };

  const textQuery: estypes.QueryDslQueryContainer = {
    bool: { must: [baseTextQuery], filter },
  };

  const knnQuery: estypes.KnnQuery = {
    field: 'vector',
    query_vector: embeddings[0],
    k: searchResultMaxSize,
    num_candidates: 200,
    filter,
  };

  const fullSearchQueryBody = {
    query: textQuery,
    knn: knnQuery,
    rank: {
      rrf: {
        rank_constant: searchResultMaxSize * 2,
      },
    },
  };

  const searchResults = await searchClient.search<PolicyIndex>({
    index: indexName,
    size: searchResultMaxSize,
    body: fullSearchQueryBody,
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

  // deduplication + filter out large documents by token count
  const getEligibleDocs = (results: PolicyIndex[]) => {
    const docs = new Set<string>();

    results.forEach((result) => {
      const url = result.metadata.url;
      if (
        !url ||
        result.metadata.doc_tokens === null ||
        result.metadata.doc_tokens === undefined
      ) {
        return;
      }

      // filter out documents greater token limit
      if (result.metadata.doc_tokens > MAX_DOC_TOKENS) {
        return;
      }

      docs.add(url);
    });

    return docs;
  };

  const eligibleDocs = getEligibleDocs(allResults);
  const contextResults = await addFullDocument(allResults, eligibleDocs);

  return contextResults;
};

export const getDocumentByUrl = async (url: string): Promise<string | null> => {
  if (!url) {
    return null;
  }

  const document = await prisma.documents.findFirst({
    where: { url },
    select: {
      documentContents: {
        select: {
          content: true,
        },
      },
    },
  });

  return document?.documentContents?.content ?? null;
};

export const addFullDocument = async (
  results: PolicyIndex[],
  eligibleDocs: Set<string>
): Promise<PolicyIndex[]> => {
  const filteredDocs = new Map<string, string>();
  const MAX_FULL_DOCS = 1;
  for (const url of eligibleDocs) {
    if (filteredDocs.size >= MAX_FULL_DOCS) {
      break;
    }

    const fullDocument = await getDocumentByUrl(url);
    if (!fullDocument) {
      continue;
    }

    filteredDocs.set(url, fullDocument);
  }

  if (filteredDocs.size === 0) {
    return results;
  }

  const finalResults: PolicyIndex[] = [];
  const insertedPromotedUrls = new Set<string>();

  for (const result of results) {
    const url = result.metadata.url;

    if (!filteredDocs.has(url)) {
      finalResults.push(result);
      continue;
    }

    if (insertedPromotedUrls.has(url)) {
      continue;
    }

    finalResults.push({
      ...result,
      text: filteredDocs.get(url)!,
    });

    insertedPromotedUrls.add(url);
  }

  return finalResults;
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
  if (!docText) {
    // if we don't have any documents, we can't do anything, but still use the llm to respond so the pipeline is consistent
    return {
      id: '1',
      role: 'system',
      content:
        "Reply with: Sorry, I couldn't find enough information to answer your question",
    } as ChatMessage;
  }

  return {
    id: '1',
    role: 'system',
    content: `
    ## Basic Rules
You are a helpful assistant who is an expert in university policy at UC Davis. When you answer the user's requests, ALWAYS cite your sources in your answers, according to the provided instructions. Always respond in well-formatted markdown.
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
  } as ChatMessage;
};
