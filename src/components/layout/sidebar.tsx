import React from 'react';

import Link from 'next/link';

import { buildVersion } from '@/models/static';

interface SidebarProps {
  history: React.ReactNode;
  footer: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ history, footer }) => {
  return (
    <div className='sidebar-wrapper'>
      <div className='sidebar-container'>
        <header>
          <h1 className='logo'>
            <Link href='/'>
              PolicyWonk <br />
              <span className='subtitle'>Your UC Policy expert</span>
            </Link>
          </h1>
          {history}
        </header>
        {/* {footer} */}
        <div className='alert-tag'>
          <p>Beta v{buildVersion}</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
