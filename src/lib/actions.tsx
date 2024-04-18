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
import { ChatHistory, UIState, defaultLlmModel } from '@/models/chat';
import {
  getEmbeddings,
  getSearchResults,
  getSystemMessage,
  expandedTransformSearchResults,
} from '@/services/chatService';
import { saveChat } from '@/services/historyService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const llmModel = process.env.OPENAI_LLM_MODEL ?? defaultLlmModel;

async function submitUserMessage(userInput: string) {
  'use server';

  // provided by <AI> in the page.tsx
  const aiState = getMutableAIState<typeof AI>();

  // before we actually do anything, stream loading UI (for the chat window)
  // user message is added on client
  const chatWindowUI = createStreamableUI();

  const chatId = aiState.get().id; // provided on the page.tsx <AI> provider
  const userMsgId = nanoid();
  const wonkMsgId = nanoid();

  // and create the text stream for the response
  let textStream = createStreamableValue();
  // wonk thoughts for fun, but also to show that we can update at any point
  let wonkThoughts = createStreamableValue(
    'Great question! Let me look that up for you.'
  );

  let textNode: React.ReactNode = (
    <WonkMessage
      chatId={chatId}
      content={textStream.value}
      wonkThoughts={wonkThoughts.value}
      isLoading={true}
    />
  );
  chatWindowUI.update(textNode);

  // then start our async process
  // this is an immediately invoked function expression (IIFE) so that the above code is not blocked
  (async () => {
    wonkThoughts.update('Getting embeddings...');
    const embeddings = await getEmbeddings(userInput);

    wonkThoughts.update('Searching for relevant documents...');
    const searchResults = await getSearchResults(embeddings);

    const transformedResults = expandedTransformSearchResults(searchResults);

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

    wonkThoughts.done('Aha! Got it! :)'); // chatMessage component controls when to stop showing this message

    // The `render()` creates a generated, streamable UI.
    // this is the response itself. render returns a ReactNode (our textNode)
    render({
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
          textStream.done();
          const finalNode = (
            <WonkMessage
              chatId={chatId}
              key={wonkMsgId}
              content={content}
              isLoading={false}
              wonkThoughts={''}
            />
          );
          // finally, close out the initial UI stream with the final node
          chatWindowUI.done(finalNode);
          // and update the AI state with the final message
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
          // TODO: use onSetAIState when it is no longer unstable
          (async () => {
            // save the chat to the db
            await saveChat(chatId, aiState.get().messages);
          })();
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
export const AI = createAI<ChatHistory, UIState>({
  actions: {
    submitUserMessage,
  },
  initialUIState: [],
  initialAIState: {
    id: nanoid(),
    messages: [],
    title: '',
    llmModel: llmModel,
    user: '',
    userId: '',
    reaction: undefined,
    timestamp: Date.now(),
  },
  // TODO: use onSetAIState when it is no longer unstable
  // then we can automatically save the chat to the db whenever the state changes
  // TODO: also, onGetUIState
});

export const getUIStateFromAIState = (aiState: ChatHistory) => {
  return aiState.messages
    .filter((message) => message.role !== 'system')
    .map((message: Message, index) => ({
      id: message.id,
      display:
        message.role === 'user' ? (
          <UserMessage>{message.content}</UserMessage>
        ) : (
          <WonkMessage
            chatId={aiState.id}
            content={message.content}
            isLoading={false}
            wonkThoughts={''}
          />
        ),
    }));
};
