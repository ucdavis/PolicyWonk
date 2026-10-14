import { describe, expect, it } from 'vitest';

import {
  isSidebarLargeScreen,
  sidebarBreakpoint,
} from './collapsibleSidebarProvider';

describe('isSidebarLargeScreen', () => {
  it('matches Tailwind’s lg breakpoint', () => {
    expect(sidebarBreakpoint).toBe(1024);
    expect(isSidebarLargeScreen(1023)).toBe(false);
    expect(isSidebarLargeScreen(1024)).toBe(true);
  });
});
