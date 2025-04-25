'use client';

import React from 'react';

import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faInfoCircle, faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';

// import Link from 'next/link';

const FooterLinks: React.FC = () => {
  return (
    <div>
      <ul className='footer-links'>
        <li>
          <Link className='discreet-link' href='/privacy'>
            Privacy
          </Link>
          {''}|
        </li>
        <li>
          <Link className='discreet-link' href='/about'>
            About
          </Link>
          {''}|
        </li>
        <li>
          <Link className='discreet-link' href='/about'>
            Disclaimer
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default FooterLinks;
