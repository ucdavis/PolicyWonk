import { Message } from 'ai';
import {
  createAI,
  createStreamableValue,
  getMutableAIState,
  render,
} from 'ai/rsc';
import { nanoid } from 'nanoid';
import { OpenAI } from 'openai';
import { z } from 'zod';

import { BotMessage } from '@/components/chat/chatMessage';
import { getChatMessages, getSystemMessage } from '@/services/chatService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// An example of a spinner component. You can also import your own components,
// or 3rd party component libraries.
function Spinner() {
  return <div>Loading...</div>;
}

async function submitUserMessage(userInput: string) {
  'use server';

  // first get the state of our AI
  const aiState = getMutableAIState<typeof AI>();

  // get the user message and our generated system message
  const initialMessages = await getChatMessages(userInput);

  // Update the AI state
  // different than just adding it below in ui, this is the actual AI state
  aiState.update({
    ...aiState.get(), // chat id
    messages: [...aiState.get().messages, ...initialMessages],
  });

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>;
  let textNode: undefined | React.ReactNode;

  // The `render()` creates a generated, streamable UI.
  const ui = render({
    model: 'gpt-4-0125-preview',
    provider: openai,
    initial: <Spinner />,
    messages: [
      ...aiState.get().messages.map((m: any) => ({
        role: m.role,
        content: m.content,
        name: m.name,
      })),
    ],
    // `text` is called when an AI returns a text response (as opposed to a tool call).
    // Its content is streamed from the LLM, so this function will be called
    // multiple times with `content` being incremental.
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('');
        textNode = <BotMessage content={textStream.value} />;
      }

      if (done) {
        textStream.done();
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content,
            },
          ],
        });
      } else {
        textStream.update(delta);
      }

      return textNode;
    },
    // tools: {
    //   get_flight_info: {
    //     description: 'Get the information for a flight',
    //     parameters: z
    //       .object({
    //         flightNumber: z.string().describe('the number of the flight'),
    //       })
    //       .required(),
    //     render: async function* ({ flightNumber }) {
    //       // Show a spinner on the client while we wait for the response.
    //       yield <Spinner />;

    //       // Fetch the flight information from an external API.
    //       const flightInfo = await getFlightInfo(flightNumber);

    //       // Update the final AI state.
    //       aiState.done([
    //         ...aiState.get(),
    //         {
    //           role: 'function',
    //           name: 'get_flight_info',
    //           // Content can be any string to provide context to the LLM in the rest of the conversation.
    //           content: JSON.stringify(flightInfo),
    //         },
    //       ]);

    //       // Return the flight card to the client.
    //       return <FlightCard flightInfo={flightInfo} />;
    //     },
    //   },
    // },
  });

  return {
    id: nanoid(),
    display: ui,
  };
}

export type AIState = {
  chatId: string;
  messages: Message[];
};

export type UIState = {
  id: string;
  display: React.ReactNode;
}[];

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
