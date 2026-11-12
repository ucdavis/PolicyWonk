import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const { auth, chats, logMessages, logReaction } = vi.hoisted(() => ({
  auth: vi.fn(),
  chats: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  logMessages: vi.fn(),
  logReaction: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/auth', () => ({ auth }));
vi.mock('@/lib/db', () => ({
  default: {
    chats,
    $transaction: async (
      operation: (transaction: unknown) => Promise<unknown>
    ) => operation({ $executeRaw: vi.fn(), chats }),
  },
}));
vi.mock('./loggingService', () => ({ logMessages, logReaction }));
vi.mock('./chatService', () => ({ llmModel: 'test-model' }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import {
  shareChat,
  unshareChat,
  submitFeedback,
  deleteChatFromSidebar,
} from '@/lib/actions';
import { focuses } from '@/models/focus';

import {
  getChat,
  getSharedChat,
  saveChat,
  saveReaction,
} from './historyService';

beforeEach(() => {
  vi.resetAllMocks();
  auth.mockResolvedValue({ userId: 1, user: { name: 'Test' } });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

it.each([null, {}, { message: 'configuration error' }, { userId: 1 }])(
  'denies callable mutations for invalid sessions %j',
  async (session) => {
    auth.mockResolvedValue(session);
    for (const action of [
      () => shareChat('chat'),
      () => unshareChat('chat'),
      () => submitFeedback('chat', 'thumbs_up'),
      () => deleteChatFromSidebar('chat', false),
    ]) {
      await expect(action()).rejects.toThrow('500');
    }
    expect(await getChat('chat')).toEqual({ status: '401' });
    expect(await getSharedChat('share')).toEqual({ status: '401' });
    Object.values(chats).forEach((method) =>
      expect(method).not.toHaveBeenCalled()
    );
    expect(logReaction).not.toHaveBeenCalled();
  }
);

it("denies reaction and sharing writes to another user's chat", async () => {
  chats.findFirst.mockResolvedValue(null);
  for (const action of [
    () => shareChat('other-chat'),
    () => unshareChat('other-chat'),
    () => submitFeedback('other-chat', 'thumbs_up'),
  ]) {
    await expect(action()).rejects.toThrow('500');
  }
  for (const [query] of chats.findFirst.mock.calls) {
    expect(query.where).toMatchObject({
      id: 'other-chat',
      userId: 1,
      active: true,
    });
  }
  expect(chats.update).not.toHaveBeenCalled();
  expect(logReaction).not.toHaveBeenCalled();
});

it('keeps a successful answer save when telemetry fails', async () => {
  chats.create.mockResolvedValue({ id: 'saved' });
  logMessages.mockRejectedValue(new Error('offline'));
  expect(
    await saveChat(
      'saved',
      [{ id: 'm', role: 'user', content: 'Question' }],
      'ucdavis',
      focuses[0]
    )
  ).toEqual({ status: '200', data: true });
  expect(chats.create.mock.calls[0][0].data.userId).toBe(1);
});

it('validates reactions at runtime and preserves saved feedback when telemetry fails', async () => {
  expect(await saveReaction('chat', 'arbitrary' as never)).toEqual({
    status: '403',
  });
  expect(chats.findFirst).not.toHaveBeenCalled();
  chats.findFirst.mockResolvedValue({ meta: {} });
  chats.update.mockResolvedValue({ id: 'chat' });
  logReaction.mockRejectedValue(new Error('offline'));
  await expect(submitFeedback('chat', 'thumbs_up')).resolves.toBeUndefined();
  expect(chats.update.mock.calls[0][0].data.meta.reaction).toBe('thumbs_up');
});

it('does not start persistence if cancellation happens during authentication', async () => {
  const controller = new AbortController();
  auth.mockImplementation(async () => {
    controller.abort();
    return { userId: 1, user: { name: 'Test' } };
  });
  await expect(
    saveChat('cancelled', [], 'ucdavis', focuses[0], controller.signal)
  ).rejects.toThrow();
  expect(chats.create).not.toHaveBeenCalled();
  expect(logMessages).not.toHaveBeenCalled();
});
