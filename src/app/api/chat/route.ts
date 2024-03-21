import OpenAI from 'openai';

export const runtime = 'nodejs';
// This is required to enable streaming
export const dynamic = 'force-dynamic';

// API key is stored in env
const openai = new OpenAI();

export async function POST(request: Request) {
  // get message from request body
  const { message } = await request.json();

  if (!message) {
    return new Response('Invalid request', { status: 400 });
  }

  let responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  try {
    const openaiRes = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // TODO: make this configurable
      messages: [{ role: 'user', content: message }],
      stream: true,
    });

    // @ts-ignore
    openaiRes.data.on('data', async (data: Buffer) => {
      const lines = data
        .toString()
        .split('\n')
        .filter((line: string) => line.trim() !== '');
      for (const line of lines) {
        const message = line.replace(/^data: /, '');
        if (message === '[DONE]') {
          console.log('Stream completed');
          writer.close();
          return;
        }
        try {
          const parsed = JSON.parse(message);
          await writer.write(encoder.encode(`${parsed.choices[0].text}`));
        } catch (error) {
          console.error('Could not JSON parse stream message', message, error);
        }
      }
    });
  } catch (error) {
    console.error('An error occurred during OpenAI request', error);
    writer.write(encoder.encode('An error occurred during OpenAI request'));
    writer.close();
  }

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
