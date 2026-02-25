import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
} from 'ai';
import { nanoid } from 'nanoid';

import { auth } from '@/auth';
import { createCitationsTransform } from '@/lib/chat/citationsTransform';
import { isWonkSuccess } from '@/lib/error/error';
import { isValidGroupName } from '@/lib/groups';
import {
  focuses,
  getFocusWithSubFocus,
  getFocusesForGroup,
} from '@/models/focus';
import type { WonkSession } from '@/models/session';
import {
  expandedTransformSearchResults,
  getEmbeddings,
  getSearchResultsElastic,
  getSystemMessage,
  llmModel,
  openai,
} from '@/services/chatService';
import { saveChat } from '@/services/historyService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getTextFromParts = (parts: unknown): string => {
  if (!Array.isArray(parts)) {
    return '';
  }

  return parts
    .filter((part) => part && typeof part === 'object' && part.type === 'text')
    .map((part) => (part as any).text)
    .filter((text): text is string => typeof text === 'string')
    .join('');
};

export async function POST(req: Request) {
  const session = (await auth()) as WonkSession;
  if (!session?.userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const messages = body?.messages;
  const group = body?.group;
  const focusParam = body?.focus as string | undefined;
  const subFocusParam = body?.subFocus as string | undefined;

  if (typeof group !== 'string' || !isValidGroupName(group)) {
    return new Response('Invalid group', { status: 400 });
  }

  const focusOptions = getFocusesForGroup(group);
  const requestedFocus = getFocusWithSubFocus(focusParam, subFocusParam);
  const focus =
    requestedFocus && focusOptions.some((f) => f.name === requestedFocus.name)
      ? requestedFocus
      : (focusOptions[0] ?? focuses[0]);

  const lastUserMessage = Array.isArray(messages)
    ? [...messages].reverse().find((m) => m?.role === 'user')
    : null;
  const userInput = getTextFromParts(lastUserMessage?.parts).trim();

  if (!userInput) {
    return new Response('Missing user message', { status: 400 });
  }

  const chatId = nanoid();

  let chatSaved = false;

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const writeThought = (thought: string) => {
        writer.write({
          type: 'data-aggiethought',
          data: thought,
          transient: true,
        });
      };

      writeThought('Getting embeddings...');
      const embeddings = await getEmbeddings(userInput);

      writeThought('Searching for relevant documents...');
      const searchResults = await getSearchResultsElastic(embeddings, focus);

      const transformedResults = expandedTransformSearchResults(searchResults);
      const systemMessage = getSystemMessage(transformedResults);

      const modelMessages = await convertToModelMessages(
        Array.isArray(messages) ? messages : []
      );

      writeThought('Search complete, getting your answer...');

      const result = streamText({
        model: openai(llmModel),
        system: systemMessage.content,
        messages: modelMessages,
        providerOptions: {
          openai: { reasoningEffort: 'medium' },
        },
        experimental_transform: createCitationsTransform({
          policies: searchResults,
          onAssistantTextComplete: async (assistantText) => {
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
    },
  });

  return createUIMessageStreamResponse({ stream });
}
