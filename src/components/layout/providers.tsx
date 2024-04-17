import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

import { auth } from '@/auth';

export default async function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = (await auth()) as Session;
  console.log('rendering');
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
