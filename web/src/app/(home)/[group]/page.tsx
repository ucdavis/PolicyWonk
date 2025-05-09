import React from 'react';

import { redirect } from 'next/navigation';

interface RedirectComponentProps {
  searchParams: { [key: string]: string | string[] };
}

const RedirectComponent: React.FC<RedirectComponentProps> = ({
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

  // TODO: move to campus chooser
  const destination = `/ucdavis/chat/new?${params.toString()}`;
  redirect(destination);

  return null; // this component will never render
};

export default RedirectComponent;
