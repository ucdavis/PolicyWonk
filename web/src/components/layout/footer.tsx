import React from 'react';

import Image from 'next/image';

import Ucoplogo from '/public/media/uc-wordmark-blue-official.svg';

import FooterLinks from './footerLinks';
// import UserNameDisplay from './userNameDisplay';

const Footer: React.FC = () => {
  return (
    <footer>
      <div className='campus-toggle'>Campus Chooser: UC Davis</div>
      <FooterLinks />
      <a target='_blank' rel='noopener noreferrer' href='https://ucop.edu'>
        UCOP logo here
        {/* <Image width={85} src={Ucoplogogo} alt='UC Davis logo greyscale' /> */}
      </a>
      <p>Copyright &copy; All rights reserved.</p>
    </footer>
  );
};

export default Footer;
