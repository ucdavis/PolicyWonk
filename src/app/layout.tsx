// to fix large icons on first load
// see: https://docs.fontawesome.com/web/use-with/react/use-with & https://github.com/FortAwesome/react-fontawesome/issues/134
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css'; // Import the CSS
config.autoAddCss = false; // Tell Font Awesome to skip adding the CSS automatically since it's being imported above
import { GoogleTagManager } from '@next/third-parties/google';
import type { Metadata } from 'next';

import './styles/main.scss';
import ChatHistory from '@/components/chatHistory/chatHistory';
import Footer from '@/components/layout/footer';
import MobileSidebar from '@/components/layout/mobileSidebar';
import Providers from '@/components/layout/providers';
import Sidebar from '@/components/layout/sidebar';

export const metadata: Metadata = {
  title: 'Policy Wonk',
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
        <GoogleTagManager gtmId='GTM-NNCH6SSL' />

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
            <div className='sidebar-wrapper'>
              <div className='mobile-sidebar'>
                <MobileSidebar history={<ChatHistory />} footer={<Footer />} />
              </div>
              <div className='desktop-sidebar'>
                <Sidebar history={<ChatHistory />} footer={<Footer />} />
              </div>
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
