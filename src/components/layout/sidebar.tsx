import React from 'react';
import Footer from './footer';
import { auth } from '@/auth';

const Sidebar: React.FC = () => {
  return (
    <div className='sidebar-container'>
      <header>
        <h3>
          <a href='/' className='logo'>
            Policy Wonk
          </a>
        </h3>

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
