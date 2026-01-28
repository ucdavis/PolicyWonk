import React from 'react';

import { redirect } from 'next/navigation';

import { getCurrentGroup } from '@/lib/cookies';

interface RedirectComponentProps {
  searchParams: { [key: string]: string | string[] };
}

const RedirectComponent: React.FC<RedirectComponentProps> = async (props) => {
  const searchParams = await props.searchParams;
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((val) => params.append(key, val));
    } else {
      params.append(key, value);
    }
  }

  const group = await getCurrentGroup();

  const destination = `/${group}/chat/new?${params.toString()}`;
  redirect(destination);

  return null; // this component will never render
};

export default RedirectComponent;
