import React from 'react';

import Link from 'next/link';

import { buildVersion } from '../../models/static';

import Footer from './footer';

interface SidebarProps {
  history: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ history }) => {
  return (
    <div className='wonk-sidebar-wrapper'>
      <header className='wonk-sidebar-header '>
        buttons for nav/new chat here
      </header>
      <div className='wonk-sidebar-main container'>
        <div className='chat-history-wrapper'>{history}</div>
        {/* <div className='alert-tag'>
          <p>BETA v{buildVersion}</p>
        </div> */}
        <Footer />
      </div>
    </div>
  );
};

export default Sidebar;
