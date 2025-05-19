'use client';
import React from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { campusMap, DEFAULT_GROUP } from '@/lib/constants';

const SiteBrand = () => {
  const pathname = usePathname();
  const pathGroup = pathname?.split('/')[1];
  const group = pathGroup && campusMap[pathGroup] ? pathGroup : DEFAULT_GROUP;
  const { logoPath, link } = campusMap[group];
  const chatHref = `/${group}/chat/new`;

  return (
    <div className='wonk-header d-flex container justify-content-between align-items-center'>
      <div>
        <Link className='site-brand' href={chatHref} title='Start a new chat'>
          <h1 className='mb-0'>PolicyWonk</h1>
        </Link>

        <p className='discreet m-0'>Beta v0.87</p>
      </div>
      <div className='text-end'>
        <Link href={link} target='_blank' rel='noopener noreferrer'>
          <Image src={logoPath} alt='Logo' width={100} height={20} />
        </Link>
      </div>
    </div>
  );
};

export default SiteBrand;
