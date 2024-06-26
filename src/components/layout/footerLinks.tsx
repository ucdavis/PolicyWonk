'use client';

import React from 'react';

import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faInfoCircle, faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';

// import Link from 'next/link';

const FooterLinks: React.FC = () => {
  return (
    <div className='external-links'>
      <Link className='ps-2' href='/privacy'>
        <FontAwesomeIcon icon={faLock} />
      </Link>
      <Link className='ps-2' href='/about'>
        <FontAwesomeIcon icon={faInfoCircle} />
      </Link>
      <a
        target='_blank'
        rel='noopener noreferrer'
        href='https://github.com/ucdavis/PolicyWonk'
        className='ps-2'
      >
        <FontAwesomeIcon icon={faGithub} />
      </a>
    </div>
  );
};

export default FooterLinks;
