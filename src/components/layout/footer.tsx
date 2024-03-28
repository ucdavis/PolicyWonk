import React from 'react';

import Image from 'next/image';

import Logo from '/public/media/ucdavis-grey.svg';

const Footer: React.FC = () => {
  return (
    <footer>
      <a target='_blank' href='https://ucdavis.edu'>
        <Image src={Logo} alt='UC Davis logo greyscale' />
      </a>
      <p>
        copyright 2024 code here
        <br />
        <span className='version-notice'>Policywonk v1.2.3.311</span>
      </p>
    </footer>
  );
};

export default Footer;
