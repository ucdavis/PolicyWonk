'use server';
import { Message } from 'ai';
import {
  createStreamableUI,
  createStreamableValue,
  getMutableAIState,
  streamUI,
} from 'ai/rsc';
import { nanoid } from 'nanoid';

import { WonkMessage } from '@/components/chat/answer/wonkMessage';
import { Feedback, UIStateNode } from '@/models/chat';
import { Focus } from '@/models/focus';
import {
  getEmbeddings,
  getSearchResults,
  getSystemMessage,
  expandedTransformSearchResults,
  openai,
  llmModel,
  transformContentWithCitations,
} from '@/services/chatService';
import {
  removeChat,
  removeShareChat,
  saveChat,
  saveReaction,
  saveShareChat,
} from '@/services/historyService';

import { AI } from './aiProvider';

// to add an action, add it to this type and also in createAI at the bottom of this file
// the functions need to be above the createAI call or you get the very helpful error "action is not a function"
export type WonkActions<T = any, R = any> = {
  submitUserMessage: (userInput: string, focus: Focus) => Promise<UIStateNode>;
  shareChat: (chatId: string) => Promise<void>;
  unshareChat: (chatId: string) => Promise<void>;
  submitFeedback: (chatId: string, feedback: Feedback) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
};

export const submitUserMessage = async (userInput: string, focus: Focus) => {
  // provided by <AI> in the page.tsx
  const aiState = getMutableAIState<typeof AI>();

  // before we actually do anything, stream loading UI (for the chat window)
  // user message is added on client
  const chatWindowUI = createStreamableUI();

  // and create the text stream for the response
  let textStream = createStreamableValue();
  // wonk thoughts for fun, but also to show that we can update at any point
  let wonkThoughts = createStreamableValue(
    'Great question! Let me look that up for you.'
  );

  let textNode: React.ReactNode = (
    <WonkMessage
      content={textStream.value}
      wonkThoughts={wonkThoughts.value}
      isLoading={true}
    />
  );
  chatWindowUI.update(textNode);

  // TODO: move into separate function
  // then start our async process
  // this is an immediately invoked function expression (IIFE) so that the above code is not blocked
  (async () => {
    wonkThoughts.update('Getting embeddings...');
    const embeddings = await getEmbeddings(userInput);

    wonkThoughts.update('Searching for relevant documents...');
    const searchResults = await getSearchResults(embeddings, focus);

    const transformedResults = expandedTransformSearchResults(searchResults);

    const systemMessage = getSystemMessage(transformedResults);

    const initialMessages: Message[] = [
      systemMessage, // system message with full document info
      {
        id: nanoid(), // new id for the user message
        role: 'user',
        content: userInput,
      },
    ];

    // Update the AI state
    aiState.update({
      ...aiState.get(), // blank state
      id: nanoid(), // where the new id is generated
      focus, // focus from the user
      messages: [...aiState.get().messages, ...initialMessages],
    });

    wonkThoughts.done('Search complete, getting your answer...'); // chatMessage component controls when to stop showing this message

    // start streaming the assistant response, this returns the ReactNode to render
    streamUI({
      model: openai(llmModel),
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

          // once we are finished, we need to modify the content to transform the citations
          const finalContent = transformContentWithCitations(
            content,
            searchResults
          );

          const finalNode = (
            <WonkMessage
              content={finalContent}
              isLoading={false}
              wonkThoughts={''}
            />
          );

          // finally, close out the initial UI stream with the final node
          chatWindowUI.done(finalNode);
          // and update the AI state with the final message
          aiState.done({
            ...aiState.get(),
            focus,
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(), // new id for the message
                role: 'assistant',
                content: finalContent,
              },
            ],
          });
          (async () => {
            // save the chat to the db
            await saveChat(aiState.get().id, aiState.get().messages, focus);
          })();
        } else {
          textStream.update(delta);
        }

        // return the node to render
        return textNode;
      },
    });
  })();

  const uiNode: UIStateNode = {
    id: nanoid(),
    display: chatWindowUI.value,
  };
  return uiNode;
};

export const shareChat = async (chatId: string) => {
  const aiState = getMutableAIState<typeof AI>();

  const shareChat = await saveShareChat(chatId);
  // TODO handle errors?
  aiState.done({
    ...aiState.get(),
    shareId: shareChat,
  });
};

export const unshareChat = async (chatId: string) => {
  const aiState = getMutableAIState<typeof AI>();

  await removeShareChat(chatId);
  // TODO handle errors?
  aiState.done({
    ...aiState.get(),
    shareId: undefined,
  });
};

export const submitFeedback = async (chatId: string, feedback: Feedback) => {
  const aiState = getMutableAIState<typeof AI>();

  await saveReaction(chatId, feedback);
  aiState.done({
    ...aiState.get(),
    reaction: feedback,
  });
};

export const deleteChat = async (chatId: string) => {
  await removeChat(chatId);
};
