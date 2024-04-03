'use client';

import React from 'react';

import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// import Link from 'next/link';

const SidebarLinks: React.FC = () => {
  return (
    <div className='external-links'>
      <a
        target='_blank'
        rel='noopener noreferrer'
        href='https://computing.caes.ucdavis.edu/'
      >
        <FontAwesomeIcon icon={faInfoCircle} />
      </a>
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

export default SidebarLinks;
