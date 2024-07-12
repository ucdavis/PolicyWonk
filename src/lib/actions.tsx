'use server';
import { Message } from 'ai';
import {
  createStreamableUI,
  createStreamableValue,
  getMutableAIState,
  streamUI,
} from 'ai/rsc';
import { nanoid } from 'nanoid';
import { redirect } from 'next/navigation';

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
import { WonkServerError, isWonkSuccess } from './error/error';

// to add an action, add it to this type and also in the aiProvider
export type WonkActions<T = any, R = any> = {
  submitUserMessage: (userInput: string, focus: Focus) => Promise<UIStateNode>;
  shareChat: (chatId: string) => Promise<void>;
  unshareChat: (chatId: string) => Promise<void>;
  submitFeedback: (chatId: string, feedback: Feedback) => Promise<void>;
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
      // id is set on save to db
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

          const finalMessages: Message[] = [
            ...aiState.get().messages,
            {
              id: nanoid(), // new id for the message
              role: 'assistant',
              content: finalContent,
            },
          ];
          (async () => {
            // where the new chat id is generated
            const chatId = nanoid();
            // save the chat to the db
            // TODO: handle errors
            const result = await saveChat(chatId, finalMessages, focus);
            if (!isWonkSuccess(result)) {
              return WonkServerError();
            }
            // and update the AI state with the final message
            aiState.done({
              ...aiState.get(),
              id: chatId, // only once the chat has been saved to the db does the aiState.id get set
              focus,
              messages: finalMessages,
            });
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
  const result = await saveShareChat(chatId);
  if (!isWonkSuccess(result)) {
    return WonkServerError();
  }

  const aiState = getMutableAIState<typeof AI>();
  aiState.done({
    ...aiState.get(),
    shareId: result.data,
  });
};

export const unshareChat = async (chatId: string) => {
  const aiState = getMutableAIState<typeof AI>();

  const result = await removeShareChat(chatId);
  if (!isWonkSuccess(result)) {
    return WonkServerError();
  }

  aiState.done({
    ...aiState.get(),
    shareId: undefined,
  });
};

export const submitFeedback = async (chatId: string, feedback: Feedback) => {
  const result = await saveReaction(chatId, feedback);
  if (!isWonkSuccess(result)) {
    return WonkServerError();
  }

  const aiState = getMutableAIState<typeof AI>();

  aiState.done({
    ...aiState.get(),
    reaction: feedback,
  });
};

/**
 * this happens outside of the AI Provider, so it does not mutate the state
 */
export const deleteChatFromSidebar = async (
  chatId: string,
  isActiveChat: boolean
) => {
  const result = await removeChat(chatId);
  if (!isWonkSuccess(result)) {
    return WonkServerError();
  }
  if (isActiveChat) {
    redirect('/');
  }
};
