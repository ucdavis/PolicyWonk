'use client';
import React, { useEffect, useState } from 'react';

import ChatSidebar from '@/components/layout/chatSidebar';
import ChatHeader from '../components/chat/chatHeader';
import WonkyClientError from '../lib/error/wonkyClientError';
import WonkyErrorBoundary from '../lib/error/wonkyErrorBoundary';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 992);
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
    <html lang='en'>
      <body>
        <main className='d-flex'>
          <WonkyErrorBoundary>
            <ChatSidebar isMobile={isMobile} />
          </WonkyErrorBoundary>

          <div className='wonk-wrapper'>
            <div className='wonk-container'>
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
