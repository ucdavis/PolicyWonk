import React from 'react';

import Image from 'next/image';

import Logo from '/public/media/ucdavis-grey.svg';

import FooterLinks from './footerLinks';
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
            <Image width={85} src={Logo} alt='UC Davis logo greyscale' />
          </a>
          <p>Copyright &copy; UC Regents, Davis campus. All rights reserved.</p>
        </div>
        <div className='col text-end'>
          <UserNameDisplay />

          <FooterLinks />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
