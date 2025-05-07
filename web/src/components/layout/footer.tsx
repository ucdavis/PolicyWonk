import React from 'react';

import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';

import Ucoplogo from '/public/media/uc_wordmark_blue_official.svg';

import FooterLinks from './footerLinks';
// import UserNameDisplay from './userNameDisplay';

const Footer: React.FC = () => {
  return (
    <footer>
      <div className='footer-campus-chooser mb-3'>
        <h3 className='mb-0'>Campus</h3>
        <button className='btn btn-link btn-icon'>
          UC Davis <FontAwesomeIcon icon={faCaretDown} />
        </button>
      </div>
      <FooterLinks />
      <a target='_blank' rel='noopener noreferrer' href='https://ucop.edu'>
        <Image width={110} src={Ucoplogo} alt='UCOP logo' />
      </a>
      <p>Copyright &copy; All rights reserved.</p>
    </footer>
  );
};

export default Footer;
