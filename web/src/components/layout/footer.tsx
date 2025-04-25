import React from 'react';

import Image from 'next/image';

import Ucoplogo from '/public/media/uc_wordmark_blue_official.svg';

import FooterLinks from './footerLinks';
// import UserNameDisplay from './userNameDisplay';

const Footer: React.FC = () => {
  return (
    <footer>
      <div className='campus-toggle'>Campus Chooser: UC Davis</div>
      <FooterLinks />
      <a target='_blank' rel='noopener noreferrer' href='https://ucop.edu'>
        <Image width={85} src={Ucoplogo} alt='UCOP logo' />
      </a>
      <p>Copyright &copy; All rights reserved.</p>
    </footer>
  );
};

export default Footer;
