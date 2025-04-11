'server only';
import { createOpenAI } from '@ai-sdk/openai';
import { EmbeddingModelV1Embedding } from '@ai-sdk/provider';
import { Message } from 'ai';

import prisma from '@/lib/db';

import { PolicyIndex } from '../models/chat';
import { Focus } from '../models/focus';

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const llmModel = process.env.OPENAI_LLM_MODEL ?? 'gpt-4o';

const embeddingModel = openai.embedding(
  process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small'
);

export const getEmbeddings = async (query: string) => {
  // get our embeddings
  const embeddings = await embeddingModel.doEmbed({
    values: [query],
  });

  return embeddings.embeddings;
};

const generateFilter = (focus: Focus): string[] => {
  if (focus.name === 'core') {
    return ['UCOP', 'UCDPOLICYMANUAL'];
  } else if (focus.name === 'apm') {
    return ['UCDAPM'];
  } else if (focus.name === 'unions') {
    //TODO: need to handle union specific sub-filters (by union)
    return ['UCCOLLECTIVEBARGAINING'];
  } else if (focus.name === 'knowledgebase') {
    return ['UCDKB'];
  }
  // unknown focus returns an empty filter (no allowed types)
  return [];
};

export const getSearchResults = async (
  embeddings: EmbeddingModelV1Embedding[],
  focus: Focus
): Promise<PolicyIndex[]> => {
  const searchResultMaxSize = 10;
  const allowedTypes = generateFilter(focus);

  const queryVector = embeddings[0];

  const rawResults: Array<{
    doc_id: number;
    title: string;
    text: string;
    meta: any;
  }> = await prisma.$queryRaw`   
    SELECT d.id as doc_id,
           d.title,
           dc.chunk_text as text,
           d.meta as meta
    FROM document_chunks dc
    JOIN documents d ON dc.document_id = d.id
    JOIN sources s ON d.source_id = s.id
    WHERE s.type = ANY(${allowedTypes})
    ORDER BY dc.embedding <=> ${queryVector}::vector
    LIMIT ${searchResultMaxSize}`;

  const allResults: PolicyIndex[] = rawResults.map((h, i) => ({
    id: h.doc_id.toString(),
    docNumber: i,
    text: h.text,
    title: h.title,
    metadata: h.meta,
    vector: [],
  }));

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
  if (!docText) {
    // if we don't have any documents, we can't do anything, but still use the llm to respond so the pipeline is consistent
    return {
      id: '1',
      role: 'system',
      content:
        "Reply with: Sorry, I couldn't find enough information to answer your question",
    } as Message;
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
  } as Message;
};
