import { Client, ClientOptions } from '@elastic/elasticsearch';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';
import { Message } from 'ai';
import {
  createAI,
  createStreamableUI,
  createStreamableValue,
  getMutableAIState,
  render,
} from 'ai/rsc';
import { nanoid } from 'nanoid';
import { OpenAI } from 'openai';

import { UserMessage, WonkMessage } from '@/components/chat/chatMessage';

import { AIState, UIState, PolicyIndex } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
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

const llmModel = process.env.OPENAI_LLM_MODEL ?? 'gpt-3.5-turbo';

async function submitUserMessage(userInput: string) {
  'use server';

  const userMsgId = nanoid();
  const wonkMsgId = nanoid();

  // before we actually do anything, stream loading UI (for the chat window)
  // might be better to add this on the client side so it is immediate (not sure how long the response will take)
  const chatWindowUI = createStreamableUI(
    <UserMessage key={userMsgId}>{userInput}</UserMessage>
  );

  // and create the text stream for the response
  let textStream = createStreamableValue();
  // wonk thoughts for fun, but also to show that we can update at any point :)
  let wonkThoughts = createStreamableValue(
    'Great question! Let me look that up for you.'
  );

  let textNode: React.ReactNode = (
    <WonkMessage
      key={wonkMsgId}
      content={textStream.value}
      wonkThoughts={wonkThoughts.value}
      isLoading={true}
    />
  );
  chatWindowUI.append(textNode);

  // then get the state of our UI
  // provided by <AI> in the page.tsx
  const aiState = getMutableAIState<typeof AI>();

  // then start our async process
  // this is an immediately invoked function expression (IIFE) so that the above code is not blocked
  (async () => {
    wonkThoughts.update('Getting embeddings...');
    const embeddings = await getEmbeddings(userInput);

    wonkThoughts.update('Searching for relevant documents...');
    const searchResults = await getSearchResults(embeddings);

    const transformedResults = transformSearchResults(searchResults);

    const systemMessage = getSystemMessage(transformedResults);

    const initialMessages: Message[] = [
      systemMessage, // system message with full document info
      {
        id: userMsgId,
        role: 'user',
        content: userInput,
      },
    ];

    // Update the AI state
    aiState.update({
      ...aiState.get(), // chat id, from initial state
      messages: [...aiState.get().messages, ...initialMessages],
    });

    wonkThoughts.update('Aha! Got it! :)');
    wonkThoughts.done();

    // The `render()` creates a generated, streamable UI.
    // we are using this as a nested UI stream, see: https://sdk.vercel.ai/docs/concepts/ai-rsc#nested-ui-streaming
    const responseUI = render({
      model: llmModel,
      provider: openai,
      initial: textNode, // TODO: fix this so the thinking animation doesn't reset
      messages: [
        ...aiState.get().messages.map((m: any) => ({
          role: m.role,
          content: m.content,
          name: m.name,
        })),
      ],
      // `text` is called when an AI returns a text response (as opposed to a tool call).
      // Its content is streamed from the LLM, so this function will be called
      // multiple times with `content` being incremental. `delta` is the new text to append.
      text: ({ content, done, delta }) => {
        if (done) {
          // once we're done, close out all our streams
          textStream.done();
          textNode = (
            <WonkMessage
              key={wonkMsgId}
              content={content}
              isLoading={false}
              wonkThoughts={wonkThoughts.value}
            />
          );
          // and update the UI state with the final message
          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: wonkMsgId,
                role: 'assistant',
                content,
              },
            ],
          });
        } else {
          textStream.update(delta);
        }

        // return the node to render
        return textNode;
      },
    });

    // finally, close out the initial UI stream
    chatWindowUI.done(responseUI);
  })();

  return {
    id: nanoid(),
    display: chatWindowUI.value,
  };
}

// AI is a provider you wrap your application with so you can access AI and UI state in your components.
export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
  },
  initialUIState: [],
  initialAIState: {
    chatId: nanoid(),
    messages: [],
  },
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