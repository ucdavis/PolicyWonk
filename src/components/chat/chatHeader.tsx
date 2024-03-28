import React from 'react';

import Image from 'next/image';

import Logo from '/public/media/policy-wonk.svg';

const ChatHeader: React.FC = ({}) => {
  return (
    <>
      <Image
        className='img-fluid policy-png'
        src={Logo}
        alt='Aggie Gold Robot cartoon'
      />
      <p className='lede'>
        Meet Policywonk, your personal guide to navigating all the ins and outs
        of UC policies...
      </p>
    </>
  );
};

export default ChatHeader;
