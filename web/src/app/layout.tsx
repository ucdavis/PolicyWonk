// to fix large icons on first load
// see: https://docs.fontawesome.com/web/use-with/react/use-with & https://github.com/FortAwesome/react-fontawesome/issues/134
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css'; // Import the CSS
import type { Metadata } from 'next';
config.autoAddCss = false; // Tell Font Awesome to skip adding the CSS automatically since it's being imported above
import { headers } from 'next/headers';

import ChatSidebar from '@/components/layout/chatSidebar';
import SiteBrand from '@/components/layout/siteBrand';
import { checkMobileOnServer } from '@/lib/checkMobileOnServer';

import './styles/main.scss';

import ChatHistory from '../components/chatHistory/chatHistory';
import Providers from '../components/layout/providers';
import GtagProvider from '../lib/gtagProvider';

export const metadata: Metadata = {
  title: {
    template: 'PolicyWonk | %s',
    default: 'PolicyWonk',
  },
  description: 'PolicyWonk: UCD Policy Expert',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = headers();
  const isMobile = checkMobileOnServer(headersList);
  return (
    <html lang='en'>
      <head>
        <GtagProvider />
        <link rel='image_src' href='/media/thumbnail.jpg' />
        <link
          rel='apple-touch-icon'
          sizes='192x192'
          href='/media/logo192.png'
        />
        <link
          rel='apple-touch-icon'
          sizes='512x512'
          href='/media/logo512.png'
        />
      </head>
      <body>
        <main className='d-flex'>
          <Providers>
            <ChatSidebar isMobile={isMobile}>
              <ChatHistory />
            </ChatSidebar>

            <div className='wonk-wrapper'>
              <SiteBrand />
              <div className='wonk-main container'>
                <div className='wonk-chat-wrapper'>{children}</div>
              </div>
            </div>
          </Providers>
        </main>
      </body>
    </html>
  );
}
