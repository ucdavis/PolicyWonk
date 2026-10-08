'use client';

import React from 'react';

import Link from 'next/link';

const FooterLinks: React.FC = () => {
  return (
    <div>
      <ul className='flex list-none justify-end gap-2 p-0 text-sm'>
        <li>
          <Link
            className='text-base-content/70 no-underline hover:text-primary'
            href='/privacy'
          >
            Privacy
          </Link>
          <span className='ml-2 text-base-content/40'>|</span>
        </li>
        <li>
          <Link
            className='text-base-content/70 no-underline hover:text-primary'
            href='/about'
          >
            About
          </Link>
          <span className='ml-2 text-base-content/40'>|</span>
        </li>
        <li>
          <Link
            className='text-base-content/70 no-underline hover:text-primary'
            href='/disclaimer'
          >
            Disclaimer
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default FooterLinks;
