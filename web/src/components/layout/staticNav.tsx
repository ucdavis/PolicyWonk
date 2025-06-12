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
    <div className='static-nav-list mb-auto'>
      <h2>Navigation</h2>
      <ul>
        {navItems.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className={`discreet-link${pathname === href ? ' active' : ''}`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StaticNav;
