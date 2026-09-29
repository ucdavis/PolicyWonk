import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';

const { getChat, resolveFocus } = vi.hoisted(() => ({
  getChat: vi.fn(),
  resolveFocus: vi.fn(),
}));
vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue({ userId: 1 }) }));
vi.mock('@/services/historyService', () => ({ getChat }));
vi.mock('@/services/chatService', () => ({ llmModel: 'test' }));
vi.mock('@/services/unionCatalog', async (original) => ({
  ...(await original<typeof import('@/services/unionCatalog')>()),
  resolveFocus,
}));
vi.mock('@/components/chat/main', () => ({
  default: ({
    initialChat,
  }: {
    initialChat: { meta: { focus: { description: string } } };
  }) => <p>{initialChat.meta.focus.description}</p>,
}));

import { FocusSelectionError } from '@/services/unionCatalog';

import ChatPage from './page';

it('displays the saved description without consulting a changed or unavailable catalog', async () => {
  getChat.mockResolvedValue({
    status: '200',
    data: {
      meta: {
        focus: {
          name: 'unions',
          subFocus: 'old',
          description: 'Original union name (old)',
        },
      },
    },
  });
  const page = await ChatPage({
    params: Promise.resolve({ group: 'ucdavis', chatid: 'saved' }),
    searchParams: Promise.resolve({}),
  });
  expect(renderToStaticMarkup(page)).toContain('Original union name (old)');
  expect(resolveFocus).not.toHaveBeenCalled();
});

it('shows an unavailable union link explicitly instead of opening the default scope', async () => {
  resolveFocus.mockRejectedValue(
    new FocusSelectionError('This unit is unavailable', 400)
  );
  const page = await ChatPage({
    params: Promise.resolve({ group: 'ucdavis', chatid: 'new' }),
    searchParams: Promise.resolve({ focus: 'unions', subFocus: 'old' }),
  });
  const html = renderToStaticMarkup(page);
  expect(html).toContain('This unit is unavailable');
  expect(html).toContain('Choose a focus');
});
