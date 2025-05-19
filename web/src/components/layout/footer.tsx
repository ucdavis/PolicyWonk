import React from 'react';

import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import Link from 'next/link';

import Ucoplogo from '/public/media/uc_wordmark_blue_official.svg';

import FooterLinks from './footerLinks';

interface FooterProps {
  group?: string;
}

const Footer: React.FC<FooterProps> = ({ group }) => {
  return (
    <footer>
      <div className='footer-campus-chooser mb-3'>
        <h3 className='mb-0'>Campus</h3>
        <Link href='/groups' passHref>
          <button className='btn btn-link btn-icon'>
            {group || 'UNKNOWN'} <FontAwesomeIcon icon={faCaretDown} />
          </button>
        </Link>
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
