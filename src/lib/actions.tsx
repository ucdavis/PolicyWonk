import { Message } from 'ai';
import {
  createAI,
  createStreamableUI,
  createStreamableValue,
  getAIState,
  getMutableAIState,
  streamUI,
} from 'ai/rsc';
import { nanoid } from 'nanoid';
import { redirect } from 'next/navigation';
import { Session } from 'next-auth';

import { auth } from '@/auth';
import FocusBanner from '@/components/chat/answer/focusBanner';
import { WonkMessage } from '@/components/chat/answer/wonkMessage';
import { UserMessage } from '@/components/chat/userMessage';
import {
  ChatHistory,
  Feedback,
  UIState,
  UIStateNode,
  blankAIState,
} from '@/models/chat';
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
  removeShareChat,
  saveChat,
  saveReaction,
  saveShareChat,
} from '@/services/historyService';

// to add an action, add it to this type and also in createAI at the bottom of this file
// the functions need to be above the createAI call or you get the very helpful error "action is not a function"
export type WonkActions<T = any, R = any> = {
  submitUserMessage: (userInput: string, focus: Focus) => Promise<UIStateNode>;
  shareChat: (chatId: string) => Promise<void>;
  unshareChat: (chatId: string) => Promise<void>;
  submitFeedback: (chatId: string, feedback: Feedback) => Promise<void>;
};

const submitUserMessage = async (userInput: string, focus: Focus) => {
  'use server'; // use server is inside of the function because only this server action
  // is async. we want to run createAI on the client

  // provided by <AI> in the page.tsx
  const aiState = getMutableAIState<typeof AI>();

  // before we actually do anything, stream loading UI (for the chat window)
  // user message is added on client
  const chatWindowUI = createStreamableUI();

  const chatId = nanoid(); // generate a new id on submit so we don't duplicate ids
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
        id: userMsgId,
        role: 'user',
        content: userInput,
      },
    ];

    // Update the AI state
    aiState.update({
      ...aiState.get(), // blank state
      id: chatId, // where the new id is generated
      focus, // focus from the user
      messages: [...aiState.get().messages, ...initialMessages],
    });

    wonkThoughts.done('Search complete, getting your answer...'); // chatMessage component controls when to stop showing this message

    // The `render()` creates a generated, streamable UI.
    // this is the response itself. render returns a ReactNode (our textNode)
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
              chatId={chatId}
              key={wonkMsgId}
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
                id: wonkMsgId,
                role: 'assistant',
                content: finalContent,
              },
            ],
          });
          // TODO: use onSetAIState when it is no longer unstable
          (async () => {
            // save the chat to the db
            await saveChat(chatId, aiState.get().messages, focus);
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

const shareChat = async (chatId: string) => {
  'use server';

  const aiState = getMutableAIState<typeof AI>();

  const shareChat = await saveShareChat(chatId);
  // TODO handle errors?
  aiState.done({
    ...aiState.get(),
    shareId: shareChat,
  });
};

const unshareChat = async (chatId: string) => {
  'use server';

  const aiState = getMutableAIState<typeof AI>();

  await removeShareChat(chatId);
  // TODO handle errors?
  aiState.done({
    ...aiState.get(),
    shareId: undefined,
  });
};

const submitFeedback = async (chatId: string, feedback: Feedback) => {
  'use server';

  const aiState = getMutableAIState<typeof AI>();

  await saveReaction(chatId, feedback);
  aiState.done({
    ...aiState.get(),
    reaction: feedback,
  });
};

// AI is a provider you wrap your application with so you can access AI and UI state in your components.
export const AI = createAI<ChatHistory, UIState, WonkActions>({
  actions: {
    submitUserMessage,
    shareChat,
    unshareChat,
    submitFeedback,
  },
  initialUIState: [],
  initialAIState: blankAIState,
  onGetUIState: async () => {
    'use server';

    const session = (await auth()) as Session;
    // middleware should take care of this, but if it doesn't then redirect to login
    if (!session?.user?.id) {
      redirect('/auth/login');
    }
    const aiState = getAIState();
    const messages: Message[] = aiState.messages;
    return messages
      .filter((message) => message.role !== 'system')
      .map((message: Message, index) => ({
        id: message.id,
        display:
          message.role === 'user' ? (
            <>
              <FocusBanner focus={aiState.focus} />
              <UserMessage user={aiState.user}>{message.content}</UserMessage>
            </>
          ) : (
            <WonkMessage
              chatId={aiState.id}
              content={message.content}
              isLoading={false}
              wonkThoughts={''}
            />
          ),
      }));
  },
  // not using onSetAIState, instead we are manually saving to the db with historyService
});
