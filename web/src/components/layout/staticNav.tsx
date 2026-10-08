'use client';

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/disclaimer', label: 'Disclaimer' },
];

const StaticNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className='px-6'>
      <h2 className='mb-3 text-xs font-semibold uppercase text-base-content/70'>
        Navigation
      </h2>
      <ul className='list-none space-y-1 p-0'>
        {navItems.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className={`block py-1 text-sm no-underline hover:text-primary ${pathname === href ? 'font-semibold text-primary' : 'text-base-content/75'}`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default StaticNav;
