import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

import { auth } from '@/auth';
import WonkToastContainer from '@/lib/error/wonkToastContainer';

export default async function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = (await auth()) as Session;
  return (
    <>
      <WonkToastContainer />
      <SessionProvider session={session}>{children}</SessionProvider>
    </>
  );
}
