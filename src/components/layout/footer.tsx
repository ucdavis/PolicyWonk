import Image from 'next/image';

import React from 'react';

import SidebarLinks from '@/components/layout/sidebarLinks';

import Logo from '/public/media/ucdavis-grey.svg';

import { Session } from 'next-auth';

import { auth } from '@/auth';

const Footer: React.FC = () => {
  return (
    <footer>
      <UserNameDisplay />
      <SidebarLinks />
      <a target='_blank' rel='noopener noreferrer' href='https://ucdavis.edu'>
        <Image src={Logo} alt='UC Davis logo greyscale' />
      </a>
      <p>
        copyright 2024 code here
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
      <div
        className='
  '
      >
        <p>
          {/* <img
            className='user-profile'
            src='/media/ph-profile.svg'
            alt='profile-avatar'
          /> */}
          {session?.user?.name}
        </p>
      </div>
    </>
  );
};
