import { generateText } from 'ai';
import { NextResponse } from 'next/server';

import { Focus } from '@/models/focus';
import {
  getEmbeddings,
  getSearchResultsPgSQL,
  expandedTransformSearchResults,
  getSystemMessage,
  openai,
  llmModel,
} from '@/services/chatService';

/**
 * Handles the POST request for chat completions.
 *
 * @param {Request} req - The incoming request object.
 * @returns {Promise<NextResponse>} The response object.
 */
export async function POST(req: Request) {
  // Authentication check
  const apiKeyValidationResponse = validateApiKey(req);

  if (!apiKeyValidationResponse.isValid) {
    return apiKeyValidationResponse.errorResponse;
  }

  // for now, only run in dev
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({
      error: 'This endpoint is only available in development mode.',
    });
  }

  // Getting request body
  const body = await req.json();

  // todo: validate the request body
  // Extract the necessary data from the request body
  const { input, focus }: ChatCompletionsRequestBody = body;

  // todo: run the input through the model
  // For now, we will just return a mock response
  const { text, context } = await runPolicyWonkModel(input, focus);

  return NextResponse.json({
    output: text,
    context,
    focus,
  });
}

const runPolicyWonkModel = async (input: string, focus: Focus) => {
  const embeddings = await getEmbeddings(input);

  // TODO: v2 uses pgsql - we aren't there yet but leaving this as v2 since v1 doesn't use the API
  const searchResults = await getSearchResultsPgSQL(embeddings, focus);

  const transformedResults = expandedTransformSearchResults(searchResults);

  const systemMessage = getSystemMessage(transformedResults);

  // collect the context ourselves for possible eval?
  const context = searchResults.map((r) => r.text);

  const { text } = await generateText({
    model: openai(llmModel),
    system: systemMessage.content,
    prompt: input,
  });

  return {
    text,
    context,
  };
};

const validateApiKey = (req: Request) => {
  return {
    isValid: true,
    errorResponse: undefined,
  };
};

type ChatCompletionsRequestBody = {
  input: string;
  focus: Focus;
};
