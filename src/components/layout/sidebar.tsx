import React from 'react';

import Link from 'next/link';

import ChatHistory from '../chat/chatHistory';
import ChatHistoryLoader from '../loading/chatHistoryLoader';

import Footer from './footer';

const Sidebar: React.FC = () => {
  return (
    <div className='sidebar-container'>
      <header>
        <h1 className='logo'>
          <Link href='/chat/new'>
            Policy Wonk <br />
            <span className='subtitle'>Your UC Policy expert</span>
          </Link>
        </h1>

        <React.Suspense // since ChatHistory is an async component, this will automatically resolve
          fallback={<ChatHistoryLoader />}
        >
          <ChatHistory />
        </React.Suspense>
      </header>
      <Footer />
    </div>
  );
};

export default Sidebar;
