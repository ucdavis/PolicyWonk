import React from 'react';

import Link from 'next/link';

import Footer from './footer';

const Sidebar: React.FC = () => {
  return (
    <div className='sidebar-container'>
      <header>
        <h1 className='logo'>
          <Link href='/'>
            Policy Wonk <br />
            <span className='subtitle'>Your UC Policy expert</span>
          </Link>
        </h1>
        <div></div>
      </header>
      <Footer />
    </div>
  );
};

export default Sidebar;
