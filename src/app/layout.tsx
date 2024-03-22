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
        <main className='row'>
          <div className='col-4 sidebar-wrapper'>
            <Sidebar />
          </div>
          <div className='col-8 main-wrapper'> {children}</div>
        </main>
      </body>
    </html>
  );
}
