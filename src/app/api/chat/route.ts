import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

const llmModel = process.env.OPENAI_LLM_MODEL ?? 'gpt-3.5-turbo';

// IMPORTANT! Set the runtime to edge
// https://vercel.com/blog/introducing-the-vercel-ai-sdk
export const runtime = 'edge';

// API key is stored in env
const openai = new OpenAI();

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages } = await req.json();

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: llmModel,
    stream: true,
    messages,
  });
  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);
  // Respond with the stream
  return new StreamingTextResponse(stream);
}
