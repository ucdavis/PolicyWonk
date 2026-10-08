import { headers } from 'next/headers';

import ChatSidebar from '@/components/layout/chatSidebar';
import StaticNav from '@/components/layout/staticNav';
import { checkMobileOnServer } from '@/lib/checkMobileOnServer';

interface StaticPageLayoutProps {
  children: React.ReactNode;
}

export default async function StaticPageLayout({
  children,
}: Readonly<StaticPageLayoutProps>) {
  const headersList = await headers();
  const isMobile = checkMobileOnServer(headersList);

  return (
    <>
      <ChatSidebar isMobile={isMobile}>
        <StaticNav />
      </ChatSidebar>
      <div className='flex min-w-0 flex-1 flex-col border-b-8 border-primary bg-white'>
        <div className='mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 md:px-10 lg:px-12'>
          <div className='min-h-0 flex-1 overflow-y-auto py-10'>
            <div className='max-w-3xl space-y-5 pb-8 text-base leading-7 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:pt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc'>
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
