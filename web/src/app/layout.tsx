// to fix large icons on first load
// see: https://docs.fontawesome.com/web/use-with/react/use-with & https://github.com/FortAwesome/react-fontawesome/issues/134
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css'; // Import the CSS
import type { Metadata } from 'next';
config.autoAddCss = false; // Tell Font Awesome to skip adding the CSS automatically since it's being imported above

import './styles/main.css';

import GtagProvider from '../lib/gtagProvider';

export const metadata: Metadata = {
  title: {
    template: 'PolicyWonk | %s',
    default: 'PolicyWonk',
  },
  description: 'PolicyWonk a UCOP policy tool',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' data-theme='policywonk'>
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
      <body className='font-sans text-base-content antialiased'>
        <main className='flex min-h-dvh'>{children}</main>
      </body>
    </html>
  );
}
