'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { getGroupFromPathname } from '@/lib/groups';

const SiteBrand = () => {
  const pathname = usePathname();
  const group = getGroupFromPathname(pathname);
  const chatHref = `/${group}/chat/new`;

  return (
    <Link
      className='block leading-tight no-underline'
      href={chatHref}
      title='Start a new chat'
    >
      <span className='block text-2xl font-bold tracking-tight text-primary'>
        PolicyWonk
      </span>
      <span className='block text-sm font-medium tracking-wide text-base-content/80'>
        UC policy assistant
      </span>
    </Link>
  );
};

export default SiteBrand;
