import { auth } from '@/auth';
import React from 'react';

const Page = () => {
  return (
    <div className='container'>
      <div className='jumbotron'>
        <h1 className='display-4'>
          Welcome to Policy Wonk <UserNameDisplay />!
        </h1>
        <p className='lead'>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </p>
      </div>
    </div>
  );
};

const UserNameDisplay = async () => {
  const session = await auth();

  return <>{session?.user?.name}!</>;
};

export default Page;
