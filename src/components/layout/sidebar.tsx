import React from 'react';

import Link from 'next/link';
import { Session } from 'next-auth';

import { auth } from '@/auth';

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
        <div>
          <UserNameDisplay />
        </div>
      </header>
      <Footer />
    </div>
  );
};

export default Sidebar;

const UserNameDisplay: React.FC = async ({}) => {
  const session = (await auth()) as Session;
  return <>{session?.user?.name}</>;
};
