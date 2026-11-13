// @vitest-environment happy-dom
import { act } from 'react';

import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { useShareUrl } from '@/lib/hooks/useShareUrl';

import {
  CollapsibleSidebarProvider,
  useCollapsibleSidebar,
} from './collapsibleSidebarProvider';

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

const Probe = () => {
  const { sidebarRef, openSidebar, isLargeScreen, isOpen } =
    useCollapsibleSidebar();
  return (
    <aside ref={sidebarRef}>
      <button onClick={openSidebar}>Open</button>
      <span>
        {isLargeScreen ? 'desktop' : 'mobile'}:{isOpen ? 'open' : 'closed'}
      </span>
    </aside>
  );
};

it('uses the real viewport at mount, handles resize, Escape, and outside clicks', async () => {
  vi.stubGlobal('innerWidth', 390);
  await act(() =>
    root.render(
      <CollapsibleSidebarProvider isMobile={false}>
        <Probe />
      </CollapsibleSidebarProvider>
    )
  );
  expect(container.textContent).toContain('mobile:closed');
  await act(() => container.querySelector('button')!.click());
  expect(container.textContent).toContain('mobile:open');
  expect(document.body.dataset.sidebarScrollLock).toBe('true');
  await act(() =>
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  );
  expect(container.textContent).toContain('mobile:closed');
  expect(document.body.dataset.sidebarScrollLock).toBeUndefined();
  await act(() => {
    vi.stubGlobal('innerWidth', 1200);
    window.dispatchEvent(new Event('resize'));
  });
  expect(container.textContent).toContain('desktop:open');
  await act(() => {
    vi.stubGlobal('innerWidth', 390);
    window.dispatchEvent(new Event('resize'));
  });
  expect(container.textContent).toContain('mobile:closed');
  await act(() => container.querySelector('button')!.click());
  await act(() =>
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  );
  expect(container.textContent).toContain('mobile:closed');
});

it('updates and clears the share URL when its props change', async () => {
  const Share = ({ id }: { id?: string }) => (
    <span>{useShareUrl(id, 'ucdavis')}</span>
  );
  await act(() => root.render(<Share id='first' />));
  expect(container.textContent).toBe(
    `${window.location.origin}/ucdavis/share/first`
  );
  await act(() => root.render(<Share id='second' />));
  expect(container.textContent).toBe(
    `${window.location.origin}/ucdavis/share/second`
  );
  await act(() => root.render(<Share />));
  expect(container.textContent).toBe('');
});
