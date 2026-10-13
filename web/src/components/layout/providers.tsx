import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

import { auth } from '../../auth';

import { NewQuestionNavigationProvider } from './newQuestionNavigationProvider';

export default async function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = (await auth()) as Session;
  return (
    <SessionProvider session={session}>
      <NewQuestionNavigationProvider>{children}</NewQuestionNavigationProvider>
    </SessionProvider>
  );
}
