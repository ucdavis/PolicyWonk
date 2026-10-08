'use client';
import React from 'react';

import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import AggieIcon from '../ui/aggieIcon';

export interface DiscreetLinks {
  text: string;
  href: string;
  icon?: IconDefinition;
}

interface DiscreetLinksListProps extends React.HTMLAttributes<HTMLElement> {
  links: DiscreetLinks[];
  linkSeparator?: string;
  ulProps?: React.HTMLAttributes<HTMLUListElement>;
}

const StaticNavLinks: React.FC<DiscreetLinksListProps> = ({
  links,
  className = '',
  linkSeparator,
  ulProps,
}) => {
  const pathname = usePathname();

  return (
    <ul className={`list-none p-0 ${ulProps?.className ?? ''}`} {...ulProps}>
      {links.map((link, index) => {
        const isActive = pathname === link.href;
        return (
          <li key={index}>
            <Link
              href={link.href}
              className={`${isActive ? 'font-semibold text-primary' : 'text-base-content/75 hover:text-primary'} no-underline${className ? ` ${className}` : ''}`}
            >
              {link.icon && <AggieIcon icon={link.icon} isDecorative={true} />}{' '}
              {link.text}
            </Link>
            {linkSeparator && index < links.length - 1 && (
              <span className='mx-1 text-base-content/40'>{linkSeparator}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default StaticNavLinks;
