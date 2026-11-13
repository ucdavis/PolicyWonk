import { z } from 'zod';

import { CHAT_LIMITS } from './limits';
export { CHAT_LIMITS } from './limits';

export class ChatRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

const textPart = z.object({ type: z.literal('text'), text: z.string() });
const message = z.object({
  id: z.string().min(1).max(128),
  role: z.enum(['user', 'assistant']),
  parts: z.array(textPart).min(1).max(32),
});
const bodySchema = z.object({
  messages: z.array(message).min(1).max(CHAT_LIMITS.messages),
  group: z.string().min(1).max(32),
  focus: z.string().max(32).optional(),
  subFocus: z.string().max(20).optional(),
});

export async function readChatRequest(req: Request, signal: AbortSignal) {
  const declaredSize = Number(req.headers.get('content-length'));
  if (declaredSize > CHAT_LIMITS.bodyBytes) {
    throw new ChatRequestError('Question is too large', 413);
  }
  if (!req.body) {
    throw new ChatRequestError('Missing request body', 400);
  }
  const bodySignal = AbortSignal.any([
    signal,
    AbortSignal.timeout(CHAT_LIMITS.bodyDurationMs),
  ]);
  const reader = req.body.getReader();
  const cancel = () => {
    void reader.cancel().catch(() => {});
  };
  bodySignal.addEventListener('abort', cancel, { once: true });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      bodySignal.throwIfAborted();
      const { done, value } = await reader.read();
      bodySignal.throwIfAborted();
      if (done) {
        break;
      }
      size += value.byteLength;
      if (size > CHAT_LIMITS.bodyBytes) {
        void reader.cancel().catch(() => {});
        throw new ChatRequestError('Question is too large', 413);
      }
      chunks.push(value);
    }
  } finally {
    bodySignal.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
  let json: unknown;
  try {
    json = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ChatRequestError('Invalid JSON body', 400);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    throw new ChatRequestError(
      'Invalid chat request. Send text messages only.',
      400
    );
  }
  const body = parsed.data;
  let characters = 0;
  for (const item of body.messages) {
    const length = item.parts.reduce((sum, part) => sum + part.text.length, 0);
    characters += length;
    if (item.role === 'user' && length > CHAT_LIMITS.userCharacters) {
      throw new ChatRequestError(
        'Question is too long. Limit it to 8,000 characters.',
        413
      );
    }
  }
  if (characters > CHAT_LIMITS.totalCharacters) {
    throw new ChatRequestError(
      'Conversation is too long. Start a new question.',
      413
    );
  }
  const last = body.messages.at(-1)!;
  const userInput = last.parts
    .map((part) => part.text)
    .join('')
    .trim();
  if (last.role !== 'user' || !userInput) {
    throw new ChatRequestError('Missing user message', 400);
  }
  // Parsing drops client metadata and provider options before model conversion.
  return { ...body, userInput };
}

type UserUsage = { started: number; requests: number; active: number };
const usage = new Map<number, UserUsage>();
let active = 0;

// These bounds apply to each app process. A distributed quota is a separate change.
export function acquireChatRequest(userId: number, now = Date.now()) {
  for (const [id, entry] of usage) {
    if (!entry.active && now - entry.started >= 60_000) {
      usage.delete(id);
    }
  }
  let entry = usage.get(userId);
  if (!entry) {
    if (usage.size >= 10_000) {
      return null;
    }
    entry = { started: now, requests: 0, active: 0 };
    usage.set(userId, entry);
  }
  if (now - entry.started >= 60_000) {
    entry.started = now;
    entry.requests = 0;
  }
  if (
    entry.requests >= CHAT_LIMITS.requestsPerMinute ||
    entry.active >= CHAT_LIMITS.concurrentPerUser ||
    active >= CHAT_LIMITS.concurrentPerProcess
  ) {
    return null;
  }
  entry.requests++;
  entry.active++;
  active++;
  let released = false;
  return () => {
    if (!released) {
      released = true;
      entry.active--;
      active--;
    }
  };
}
