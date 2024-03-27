import React from 'react';
import Footer from './footer';
import { auth } from '@/auth';

const Sidebar: React.FC = () => {
  return (
    <div className='sidebar-container'>
      <header>
        <h1 className='logo'>
          <a href='/'>
            Policy Wonk <br />
            <span className='subtitle'>Your UCD Policy expert</span>
          </a>
        </h1>

        <div>
          <UserNameDisplay />
        </div>
      </header>

      <Footer />
    </div>
  );
};

const UserNameDisplay = async () => {
  const session = await auth();

  return <>{session?.user?.name}</>;
};

export default Sidebar;
