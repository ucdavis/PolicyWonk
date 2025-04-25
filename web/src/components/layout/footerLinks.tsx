'use client';

import React from 'react';

import Link from 'next/link';

// import Link from 'next/link';

const FooterLinks: React.FC = () => {
  return (
    <div>
      <ul className='footer-links'>
        <li>
          <Link className='discreet-link me-1' href='/privacy'>
            Privacy
          </Link>
          {''}|
        </li>
        <li>
          <Link className='discreet-link ms-1 me-1' href='/about'>
            About
          </Link>
          {''}|
        </li>
        <li>
          <Link className='discreet-link ms-1' href='/about'>
            Disclaimer
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default FooterLinks;
