import React from 'react';

import Image from 'next/image';
import Link from 'next/link';

import Logo from '/public/media/policy-wonk.svg';

const ChatHeader: React.FC = ({}) => {
  return (
    <>
      <div className='home-message'>
        <Image
          className='img-fluid policy-png mb-4'
          src={Logo}
          alt='Aggie Gold Robot cartoon'
        />
        <p className='lede'>
          Meet Policywonk, your personal guide to navigating all the ins and
          outs of our UC policies. Whether you're a newcomer or a seasoned
          member of our community, this savvy assistant is here to ensure you're
          always informed and compliant. <Link href='/about'>Learn more</Link>
        </p>
      </div>
    </>
  );
};

export default ChatHeader;
