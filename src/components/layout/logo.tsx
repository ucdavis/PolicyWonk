import React from 'react';

import Image from 'next/image';

import LogoSvg from '/public/media/policy-wonk.svg';

const Logo: React.FC = () => {
  return (
    <Image
      className='img-fluid policy-png mb-4'
      src={LogoSvg}
      alt='Portrait of a cute cow with glasses and a bowtie, and an open book.'
    />
  );
};

export default Logo;
