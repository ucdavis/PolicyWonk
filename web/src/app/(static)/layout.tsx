import { headers } from 'next/headers';

import ChatSidebar from '@/components/layout/chatSidebar';
import SiteBrand from '@/components/layout/siteBrand';
import StaticNav from '@/components/layout/staticNav';
import { checkMobileOnServer } from '@/lib/checkMobileOnServer';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function StaticPageLayout({
  children,
}: Readonly<RootLayoutProps>) {
  const headersList = headers();
  const isMobile = checkMobileOnServer(headersList);

  return (
    <>
      <ChatSidebar isMobile={isMobile}>
        <StaticNav />
      </ChatSidebar>
      <div className='wonk-wrapper'>
        <SiteBrand />
        <div className='wonk-main container'>
          <div className='wonk-static-wrapper'>
            <div className='static-page-scroll'>
              <div className='static-page-wrapper'>{children}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
