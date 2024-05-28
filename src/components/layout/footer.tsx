import React from 'react';

import Image from 'next/image';

import Logo from '/public/media/ucdavis-grey.svg';

import SidebarLinks from '@/components/layout/sidebarLinks';

import UserNameDisplay from './userNameDisplay';

const Footer: React.FC = () => {
  return (
    <footer>
      <div className='row justify-content-between'>
        <div className='col'>
          <a
            target='_blank'
            rel='noopener noreferrer'
            href='https://ucdavis.edu'
          >
            <Image src={Logo} alt='UC Davis logo greyscale' />
          </a>
          <p>
            &copy; UC Regents{' '}
            <span className='version-notice'>Policywonk v1.2.3.311</span>
          </p>
        </div>
        <div className='col'>
          {/* <UserNameDisplay /> */}
          <p>User Name Login here</p>
          <SidebarLinks />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
