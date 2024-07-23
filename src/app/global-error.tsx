'use client';
import React from 'react';

import * as Sentry from '@sentry/nextjs';
import Error from 'next/error';

import ChatHeader from '@/components/chat/chatHeader';
import MobileSidebar from '@/components/layout/mobileSidebar';
import Sidebar from '@/components/layout/sidebar';
import WonkyClientError from '@/lib/error/wonkyClientError';
import WonkyErrorBoundary from '@/lib/error/wonkyErrorBoundary';

/**
 * Global error page. This will only show up in production.
 */

function GlobalError({ error }: { error: Error }) {
  React.useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
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
}

export default GlobalError;
