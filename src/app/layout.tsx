// to fix large icons on first load
// see: https://docs.fontawesome.com/web/use-with/react/use-with & https://github.com/FortAwesome/react-fontawesome/issues/134
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css'; // Import the CSS
config.autoAddCss = false; // Tell Font Awesome to skip adding the CSS automatically since it's being imported above
import type { Metadata } from 'next';

import './styles/main.scss';
import ChatHistory from '@/components/chatHistory/chatHistory';
import MobileSidebar from '@/components/layout/mobileSidebar';
import Providers from '@/components/layout/providers';
import Sidebar from '@/components/layout/sidebar';
import GtagProvider from '@/lib/gtagProvider';

export const metadata: Metadata = {
  title: {
    template: 'Policy Wonk | %s',
    default: 'Policy Wonk',
  },
  description: 'Policy Wonk: UCD Policy Expert',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
            <div className='mobile-sidebar'>
              <MobileSidebar history={<ChatHistory />} />
            </div>
            <div className='desktop-sidebar'>
              <Sidebar history={<ChatHistory />} />
            </div>

            <div className='wonk-wrapper'>
              <div className='wonk-container'>{children}</div>
            </div>
          </Providers>
        </main>
      </body>
    </html>
  );
}
