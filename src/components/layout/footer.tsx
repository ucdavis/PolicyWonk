import React from 'react';

import Image from 'next/image';

import Logo from '/public/media/ucdavis-grey.svg';

import { Session } from 'next-auth';

import { auth } from '@/auth';
import SidebarLinks from '@/components/layout/sidebarLinks';

const Footer: React.FC = () => {
  return (
    <footer>
      <UserNameDisplay />
      <SidebarLinks />
      <a target='_blank' rel='noopener noreferrer' href='https://ucdavis.edu'>
        <Image src={Logo} alt='UC Davis logo greyscale' />
      </a>
      <p>
        &copy; UC Regents
        <br />
        <span className='version-notice'>Policywonk v1.2.3.311</span>
      </p>
    </footer>
  );
};

export default Footer;

const UserNameDisplay: React.FC = async ({}) => {
  const session = (await auth()) as Session;
  return (
    <>
      <p className='mb-0'>
        <span className='me-1'>Logged in as:</span>
        {/* <img
            className='user-profile'
            src='/media/ph-profile.svg'
            alt='profile-avatar'
          /> */}
        {session?.user?.name}
      </p>
    </>
  );
};
