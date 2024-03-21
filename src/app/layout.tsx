import type { Metadata } from 'next';

import 'bootstrap/dist/css/bootstrap.min.css';

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
      <body>{children}</body>
    </html>
  );
}
