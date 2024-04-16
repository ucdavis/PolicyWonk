import type { Metadata } from 'next';

import './styles/main.scss';
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
          <div className='sidebar-wrapper'>
            <Sidebar />
          </div>
          <div className='wonk-wrapper'>
            <div className='wonk-container'>{children}</div>
          </div>
        </main>
      </body>
    </html>
  );
}
