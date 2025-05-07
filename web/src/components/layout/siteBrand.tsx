import React from 'react';

import Image from 'next/image';
import Link from 'next/link';

import ucdavislogodark from '/public/media/ucdavis_dark.svg';

const SiteBrand = () => {
  return (
    <div className='wonk-header d-flex container justify-content-between align-items-center'>
      <div>
        <Link
          className='site-brand'
          href={'/chat/new'}
          title='Start a new chat'
        >
          <h1 className='mb-0'>PolicyWonk</h1>
        </Link>

        <p className='discreet m-0'>Beta v0.87</p>
      </div>
      <div className='text-end'>
        <Link href={'https://www.ucdavis.edu/'}>
          <Image src={ucdavislogodark} alt='Logo' width={100} />
        </Link>
      </div>
    </div>
  );
};

export default SiteBrand;
