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
import {
  getEmbeddings,
  getSearchResults,
  transformSearchResults,
  getSystemMessage,
} from '@/services/chatService';

import { AIState, UIState } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const llmModel = process.env.OPENAI_LLM_MODEL ?? 'gpt-3.5-turbo';

async function submitUserMessage(userInput: string) {
  'use server';

  const userMsgId = nanoid();
  const wonkMsgId = nanoid();

  // before we actually do anything, stream loading UI (for the chat window)
  // would be better to add this on the client side so it is immediate
  // but putting it here for now
  const chatWindowUI = createStreamableUI(
    <UserMessage key={userMsgId}>{userInput}</UserMessage>
  );

  // and create the text stream for the response
  let textStream = createStreamableValue();
  // wonk thoughts for fun, but also to show that we can update at any point
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
    // this is the response itself. render returns a ReactNode (our textNode)
    const responseUI = render({
      model: llmModel,
      provider: openai,
      initial: textNode,
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
          // finally, close out the initial UI stream
          chatWindowUI.done(textNode);
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
