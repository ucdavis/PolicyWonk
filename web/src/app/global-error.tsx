'use server';
import React from 'react';

import { headers } from 'next/headers';

import ChatSidebar from '@/components/layout/chatSidebar';
import { checkMobileOnServer } from '@/lib/checkMobileOnServer';

import ChatHeader from '../components/chat/chatHeader';
import WonkyClientError from '../lib/error/wonkyClientError';
import WonkyErrorBoundary from '../lib/error/wonkyErrorBoundary';

/**
 * Global error page. This will only show up in production.
 */

const GlobalError: React.FC = async () => {
  const headersList = headers();
  const isMobile = checkMobileOnServer(headersList);
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
