import React from 'react';

import { redirect } from 'next/navigation';

import { getCurrentGroup } from '@/lib/cookies';

interface RedirectComponentProps {
  searchParams: { [key: string]: string | string[] };
  params: {
    group: string;
  };
}

const RedirectComponent: React.FC<RedirectComponentProps> = ({
  params: { group },
  searchParams,
}) => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((val) => params.append(key, val));
    } else {
      params.append(key, value);
    }
  }

  // if we have a group, let's use it, otherwise look at the cookie
  if (!group) {
    group = getCurrentGroup();
  }

  const destination = `/${group}/chat/new?${params.toString()}`;
  redirect(destination);

  return null; // this component will never render
};

export default RedirectComponent;
