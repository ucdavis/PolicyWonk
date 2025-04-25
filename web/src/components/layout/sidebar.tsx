import React from 'react';

import { faBars, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';

import { buildVersion } from '../../models/static';

import Footer from './footer';

interface SidebarProps {
  history: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ history }) => {
  return (
    <div className='wonk-sidebar-wrapper'>
      <header className='wonk-sidebar-header d-flex justify-content-between align-items-center container'>
        <button
          className='btn btn-icon btn-lg btn-link'
          aria-expanded={true}
          aria-controls='aggie-sidebar-main'
          title='close sidebar'
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <Link className='btn btn-icon btn-lg btn-link' href='#'>
          <FontAwesomeIcon icon={faPenToSquare} />
        </Link>
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
