import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
} from 'ai';
import { nanoid } from 'nanoid';

import { auth } from '@/auth';
import { createCitationsTransform } from '@/lib/chat/citationsTransform';
import {
  acquireChatRequest,
  readChatRequest,
  CHAT_LIMITS,
  ChatRequestError,
} from '@/lib/chat/request';
import { isWonkSuccess } from '@/lib/error/error';
import { isValidGroupName } from '@/lib/groups';
import { isApplicationSession } from '@/lib/session';
import {
  expandedTransformSearchResults,
  getEmbeddings,
  getSearchResultsElastic,
  getSystemMessage,
  llmModel,
  openai,
} from '@/services/chatService';
import { saveChat } from '@/services/historyService';
import { FocusSelectionError, resolveFocus } from '@/services/unionCatalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await auth();
  if (!isApplicationSession(session)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const release = acquireChatRequest(session.userId);
  if (!release) {
    return new Response('Too many questions. Please try again shortly.', {
      status: 429,
      headers: { 'Retry-After': '60' },
    });
  }
  const deadline = new AbortController();
  const timer = globalThis.setTimeout(
    () => deadline.abort(),
    CHAT_LIMITS.durationMs
  );
  const signal = AbortSignal.any([req.signal, deadline.signal]);
  const cleanup = () => {
    signal.removeEventListener('abort', cleanup);
    clearTimeout(timer);
    release();
  };
  // Release even if a downstream service fails to respond to cancellation.
  signal.addEventListener('abort', cleanup, { once: true });
  let input;
  let focus;
  try {
    input = await readChatRequest(req, signal);
    if (!isValidGroupName(input.group)) {
      throw new ChatRequestError('Invalid group', 400);
    }
    focus = await resolveFocus(input.group, input.focus, input.subFocus);
    signal.throwIfAborted();
  } catch (error) {
    cleanup();
    if (
      error instanceof FocusSelectionError ||
      error instanceof ChatRequestError
    ) {
      return new Response(error.message, { status: error.status });
    }
    if (
      signal.aborted ||
      (error instanceof Error && error.name === 'TimeoutError')
    ) {
      return new Response('Request timed out or was cancelled', {
        status: 408,
      });
    }
    throw error;
  }
  const { messages, group, userInput } = input;
  const chatId = nanoid();

  let chatSaved = false;

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      try {
        signal.throwIfAborted();
        const writeThought = (thought: string) => {
          writer.write({
            type: 'data-aggiethought',
            data: thought,
            transient: true,
          });
        };

        writeThought('Getting embeddings...');
        const embeddings = await getEmbeddings(userInput, signal);

        writeThought('Searching for relevant documents...');
        const { results: searchResults, evidenceStatus } =
          await getSearchResultsElastic(embeddings, focus, userInput, signal);

        const transformedResults =
          expandedTransformSearchResults(searchResults);
        const systemMessage = getSystemMessage(
          transformedResults,
          evidenceStatus
        );

        signal.throwIfAborted();
        if (systemMessage.content.length > CHAT_LIMITS.contextCharacters) {
          throw new Error(
            'Retrieved context is too large. Try a more specific question.'
          );
        }
        const modelMessages = await convertToModelMessages(messages);

        writeThought('Search complete, getting your answer...');

        const result = streamText({
          model: openai(llmModel),
          abortSignal: signal,
          maxOutputTokens: CHAT_LIMITS.outputTokens,
          system: systemMessage.content,
          messages: modelMessages,
          providerOptions: {
            openai: { reasoningEffort: 'medium' },
          },
          experimental_transform: createCitationsTransform({
            policies: searchResults,
            onAssistantTextComplete: async (assistantText) => {
              signal.throwIfAborted();
              const saveResult = await saveChat(
                chatId,
                [
                  systemMessage,
                  { id: nanoid(), role: 'user', content: userInput },
                  { id: nanoid(), role: 'assistant', content: assistantText },
                ],
                group,
                focus
              );

              chatSaved = isWonkSuccess(saveResult);
            },
          }),
        });

        writer.merge(
          result.toUIMessageStream({
            messageMetadata: ({ part }) => {
              if (part.type === 'finish' && chatSaved) {
                return { chatId };
              }

              return undefined;
            },
          })
        );
        await result.consumeStream();
      } finally {
        signal.removeEventListener('abort', cleanup);
        cleanup();
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
