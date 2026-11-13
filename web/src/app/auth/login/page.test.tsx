import { Children, isValidElement, type ReactNode } from 'react';

import { beforeEach, expect, it, vi } from 'vitest';

const { signIn } = vi.hoisted(() => ({ signIn: vi.fn() }));
vi.mock('@/auth', () => ({ signIn }));
vi.mock('@/lib/devAuthBypass', () => ({
  DEV_AUTH_BYPASS_PROVIDER_ID: 'dev-bypass',
  getDevAuthUserId: () => '1',
  isDevAuthBypassEnabled: () => false,
}));

import Login from './page';

type ElementProps = {
  children?: ReactNode;
  name?: string;
  value?: string;
  action?: (formData: FormData) => Promise<void>;
};

function elements(node: ReactNode, type: string): ElementProps[] {
  return Children.toArray(node).flatMap((child) => {
    if (!isValidElement<ElementProps>(child)) {
      return [];
    }
    return [
      ...(child.type === type ? [child.props] : []),
      ...elements(child.props.children, type),
    ];
  });
}

beforeEach(() => vi.clearAllMocks());

it.each([
  ['UC Berkeley', 'ucberkeley'],
  ['UC Davis', 'ucdavis'],
  ['UC Office of the President', 'ucop'],
  ['UC San Francisco', 'ucsf'],
  ['UCLA', 'ucla'],
  ['UC Merced', 'ucmerced'],
  ['UC Riverside', 'ucr'],
  ['UC San Diego', 'ucsd'],
  ['UC Santa Cruz', 'ucsc'],
  ['Berkeley Lab', 'lbl'],
])(
  'routes the %s button to the configured Jackson tenant',
  async (label, tenant) => {
    const page = await Login({ searchParams: { callbackUrl: '/ucb' } });
    const button = elements(page, 'button').find((b) => b.children === label);
    expect(button).toBeDefined();
    const callback = elements(page, 'input').find(
      (i) => i.name === 'callbackUrl'
    );
    const formData = new FormData();
    formData.set(button!.name!, button!.value!);
    formData.set(callback!.name!, callback!.value!);
    await elements(page, 'form')[0].action!(formData);

    expect(signIn).toHaveBeenCalledWith(
      'boxyhq-saml',
      { redirectTo: '/ucb' },
      { tenant, product: 'policywonk' }
    );
  }
);

it('rejects an unknown campus before initiating SSO', async () => {
  const page = await Login({ searchParams: {} });
  const formData = new FormData();
  formData.set('tenant', 'unknown');

  await expect(elements(page, 'form')[0].action!(formData)).rejects.toThrow(
    'Unknown campus'
  );
  expect(signIn).not.toHaveBeenCalled();
});
