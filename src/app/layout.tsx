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
        <main className='row'>
          <div className='sidebar-wrapper'>
            <Sidebar />
          </div>
          <div className='col-8 col-lg-9 wonk-wrapper'>{children}</div>
        </main>
      </body>
    </html>
  );
}
