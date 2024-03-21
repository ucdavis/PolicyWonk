import type { Metadata } from 'next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import './styles/main.scss';
import Sidebar from '@/components/layout/sidebar';

const queryClient = new QueryClient();

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
        <QueryClientProvider client={queryClient}>
          <main className='d-flex flex-nowrap'>
            <Sidebar />
            {children}
          </main>
        </QueryClientProvider>
      </body>
    </html>
  );
}
