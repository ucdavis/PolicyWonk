// to fix large icons on first load
// see: https://docs.fontawesome.com/web/use-with/react/use-with & https://github.com/FortAwesome/react-fontawesome/issues/134
import type { Metadata } from 'next';
import { headers } from 'next/headers';

import ChatHistory from '@/components/chatHistory/chatHistory';
import ChatSidebar from '@/components/layout/chatSidebar';
import Providers from '@/components/layout/providers';
import SiteBrand from '@/components/layout/siteBrand';
import { checkMobileOnServer } from '@/lib/checkMobileOnServer';

export const metadata: Metadata = {
  title: {
    template: 'PolicyWonk | %s',
    default: 'PolicyWonk',
  },
  description: 'PolicyWonk: UCD Policy Expert',
};

export default function RootLayout({
  children,
  params: { group },
}: Readonly<{
  children: React.ReactNode;
  params: { group: string };
}>) {
  const headersList = headers();
  const isMobile = checkMobileOnServer(headersList);

  return (
    <Providers>
      <ChatSidebar isMobile={isMobile}>
        <ChatHistory group={group} />
      </ChatSidebar>

      <div className='wonk-wrapper'>
        <SiteBrand />
        <div className='wonk-main container'>
          <div className='wonk-chat-wrapper'>{children}</div>
        </div>
      </div>
    </Providers>
  );
}
