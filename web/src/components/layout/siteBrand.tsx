import React from 'react';

import Link from 'next/link';

const SiteBrand = () => {
  return (
    <div className='wonk-header d-flex container justify-content-between align-items-center'>
      <div>
        <Link className='site-brand' href='#'>
          <h1 className='mb-0'>Policy Wonk</h1>
        </Link>

        <p className='discreet m-0'>Beta v0.87</p>
      </div>
    </div>
  );
};

export default SiteBrand;
