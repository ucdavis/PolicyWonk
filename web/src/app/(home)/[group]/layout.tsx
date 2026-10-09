// to fix large icons on first load
// see: https://docs.fontawesome.com/web/use-with/react/use-with & https://github.com/FortAwesome/react-fontawesome/issues/134
import type { Metadata } from 'next';
import { headers } from 'next/headers';

import ChatHistory from '@/components/chatHistory/chatHistory';
import ChatSidebar from '@/components/layout/chatSidebar';
import Providers from '@/components/layout/providers';
import { checkMobileOnServer } from '@/lib/checkMobileOnServer';

export const metadata: Metadata = {
  title: {
    template: 'PolicyWonk | %s',
    default: 'PolicyWonk',
  },
  description: 'PolicyWonk: UCD Policy Expert',
};

export default async function RootLayout(
  props: Readonly<{
    children: React.ReactNode;
    params: Promise<{ group: string }>;
  }>
) {
  const params = await props.params;

  const { group } = params;

  const { children } = props;

  const headersList = await headers();
  const isMobile = checkMobileOnServer(headersList);

  return (
    <Providers>
      <ChatSidebar isMobile={isMobile}>
        <ChatHistory group={group} />
      </ChatSidebar>

      <div className='flex h-dvh min-w-0 flex-1 flex-col overflow-hidden border-b-8 border-primary bg-white'>
        <div className='mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 md:px-10 lg:px-12'>
          <div className='flex min-h-0 flex-1 flex-col'>{children}</div>
        </div>
      </div>
    </Providers>
  );
}
