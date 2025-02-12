import React from 'react';

import Link from 'next/link';

import { buildVersion } from '../../models/static';

interface SidebarProps {
  history: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ history }) => {
  return (
    <div className='sidebar-wrapper'>
      <div className='sidebar-container'>
        <header>
          <h1 className='logo'>
            <Link href='/'>
              PolicyWonk <br />
              <span className='subtitle'>A UC Davis Policy resource</span>
            </Link>
          </h1>
          {history}
        </header>
        <div className='alert-tag'>
          <p>BETA v{buildVersion}</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
