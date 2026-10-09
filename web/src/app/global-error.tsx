'use client';
import React, { useEffect, useState } from 'react';

import './styles/main.css';

import ChatHeader from '@/components/chat/chatHeader';
import ChatSidebar from '@/components/layout/chatSidebar';
import WonkyClientError from '@/lib/error/wonkyClientError';
import WonkyErrorBoundary from '@/lib/error/wonkyErrorBoundary';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

/**
 * Global error page. This will only show up in production.
 */

const GlobalError: React.FC = () => {
  const isMobile = useIsMobile();
  return (
    <html lang='en' data-theme='policywonk'>
      <body>
        <main className='flex min-h-dvh'>
          <WonkyErrorBoundary>
            <ChatSidebar isMobile={isMobile} />
          </WonkyErrorBoundary>

          <div className='flex min-w-0 flex-1 flex-col border-b-8 border-primary bg-white'>
            <div className='mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pt-20 pb-9 md:px-10 lg:py-9'>
              <ChatHeader>
                <WonkyClientError
                  thereWasAnErrorLoadingThe={`application`}
                  contactLink={true}
                  type='alert'
                />
              </ChatHeader>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
