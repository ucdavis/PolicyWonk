'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

// import Link from 'next/link';

const SidebarLinks: React.FC = () => {
  return (
    <div>
      {/* <div>
        <Link href='#'>Internal Link</Link>
      </div> */}
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
          <FontAwesomeIcon icon={faInfoCircle} />
        </a>
      </div>
    </div>
  );
};

export default SidebarLinks;
