import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
} from 'ai';
import { nanoid } from 'nanoid';

import { auth } from '@/auth';
import { createCitationsTransform } from '@/lib/chat/citationsTransform';
import { abortableChatStream, waitForAbort } from '@/lib/chat/lifecycle';
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
  const deadline = new AbortController();
  const timer = globalThis.setTimeout(
    () => deadline.abort(),
    CHAT_LIMITS.durationMs
  );
  const signal = AbortSignal.any([req.signal, deadline.signal]);
  let release: (() => void) | null = null;
  let streaming = false;
  const cleanup = () => {
    clearTimeout(timer);
    release?.();
  };
  const prepare = async () => {
    signal.throwIfAborted();
    const session = await auth();
    signal.throwIfAborted();
    if (!isApplicationSession(session)) {
      return new Response('Unauthorized', { status: 401 });
    }
    release = acquireChatRequest(session.userId);
    if (!release) {
      return new Response('Too many questions. Please try again shortly.', {
        status: 429,
        headers: { 'Retry-After': '60' },
      });
    }
    const input = await readChatRequest(req, signal);
    signal.throwIfAborted();
    if (!isValidGroupName(input.group)) {
      throw new ChatRequestError('Invalid group', 400);
    }
    const focus = await resolveFocus(input.group, input.focus, input.subFocus);
    signal.throwIfAborted();
    const { messages, group, userInput } = input;
    const chatId = nanoid();

    let chatSaved = false;

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        let persistence: Promise<unknown> | undefined;
        try {
          signal.throwIfAborted();
          const writeThought = (thought: string) => {
            signal.throwIfAborted();
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
                const saving = saveChat(
                  chatId,
                  [
                    systemMessage,
                    { id: nanoid(), role: 'user', content: userInput },
                    { id: nanoid(), role: 'assistant', content: assistantText },
                  ],
                  group,
                  focus,
                  signal
                );

                persistence = saving;
                const saveResult = await saving;
                signal.throwIfAborted();
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
          await persistence?.catch(() => {});
          cleanup();
        }
      },
    });

    streaming = true;
    return createUIMessageStreamResponse({
      stream: abortableChatStream(stream, signal, () => deadline.abort()),
    });
  };

  try {
    return await waitForAbort(
      prepare().finally(() => {
        if (!streaming) {
          cleanup();
        }
      }),
      signal
    );
  } catch (error) {
    if (
      signal.aborted ||
      (error instanceof Error && error.name === 'TimeoutError')
    ) {
      return new Response('Request timed out or was cancelled', {
        status: 408,
      });
    }
    if (
      error instanceof FocusSelectionError ||
      error instanceof ChatRequestError
    ) {
      return new Response(error.message, { status: error.status });
    }
    throw error;
  }
}
