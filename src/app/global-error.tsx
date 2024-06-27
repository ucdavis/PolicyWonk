'use client';
import React from 'react';

import ChatHeader from '@/components/chat/chatHeader';
import MobileSidebar from '@/components/layout/mobileSidebar';
import Sidebar from '@/components/layout/sidebar';
import WonkyError from '@/lib/error/wonkyError';
import WonkyErrorBoundary from '@/lib/error/wonkyErrorBoundary';

/**
 * Global error page. This will only show up in production.
 */

const GlobalError: React.FC = () => {
  return (
    <html lang='en'>
      <body>
        <main className='d-flex'>
          <div className='mobile-sidebar'>
            <WonkyErrorBoundary>
              <MobileSidebar history={null} />
            </WonkyErrorBoundary>
          </div>
          <div className='desktop-sidebar'>
            <Sidebar history={null} />
          </div>

          <div className='wonk-wrapper'>
            <div className='wonk-container'>
              <ChatHeader>
                <WonkyError
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
