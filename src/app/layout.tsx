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
      <body>
        <main className='d-flex flex-nowrap'>
          <Sidebar />
          {children}
        </main>
      </body>
    </html>
  );
}
