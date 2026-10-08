import React from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { campusMap } from '@/lib/constants';

interface FooterProps extends React.ComponentPropsWithoutRef<'footer'> {
  group?: string;
}

const Footer: React.FC<FooterProps> = ({
  group,
  className,
  ...footerProps
}) => {
  const campusName = campusMap[group ?? '']?.name ?? 'Choose a location';

  return (
    <footer
      className={`border-t border-main-border ${className ?? ''}`}
      {...footerProps}
    >
      <div className='flex flex-col items-start gap-4 pt-5'>
        <nav aria-label='Sidebar footer navigation'>
          <ul className='flex list-none flex-col items-start gap-2 p-0 text-sm'>
            <li>
              <Link
                className='text-base-content/75 no-underline hover:text-primary'
                href='/groups'
              >
                {campusName}
              </Link>
            </li>
            <li>
              <Link
                className='text-base-content/75 no-underline hover:text-primary'
                href='/about'
              >
                About
              </Link>
            </li>
            <li>
              <Link
                className='text-base-content/75 no-underline hover:text-primary'
                href='/privacy'
              >
                Privacy
              </Link>
            </li>
            <li>
              <Link
                className='text-base-content/75 no-underline hover:text-primary'
                href='/disclaimer'
              >
                Disclaimer
              </Link>
            </li>
          </ul>
        </nav>
        <div className='flex flex-col items-start gap-1'>
          <a target='_blank' rel='noopener noreferrer' href='https://ucop.edu'>
            <Image
              width={100}
              height={50}
              src='/media/uc_wordmark_blue_official.svg'
              alt='University of California Office of the President'
            />
          </a>
          <p className='text-xs leading-4 text-base-content/65'>
            Copyright &copy; The Regents of the University of California.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
