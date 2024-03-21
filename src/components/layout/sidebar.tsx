import React from 'react';
import Footer from './footer';
import { auth } from '@/auth';

const Sidebar: React.FC = () => {
  return (
    <div
      className='d-flex flex-column flex-shrink-0 p-3 text-bg-dark'
      style={{ width: '280px' }}
    >
      <a
        href='/'
        className='d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none'
      >
        <svg className='bi pe-none me-2' width='40' height='32'>
          <use xlinkHref='#bootstrap' />
        </svg>
        <span className='fs-4'>Policy Wonk</span>
      </a>
      <hr />
      <div className='mb-auto'>
        <UserNameDisplay />
      </div>
      <hr />
      <Footer />
    </div>
  );
};

const UserNameDisplay = async () => {
  const session = await auth();

  return <>{session?.user?.name}</>;
};

export default Sidebar;
