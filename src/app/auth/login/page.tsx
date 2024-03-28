import React from 'react';

import { signIn } from '@/auth';

const Login: React.FC = () => {
  return (
    <>
      <h1>Login</h1>
      <form
        action={async () => {
          'use server';
          // TODO: get the callbackUrl from the query params

          await signIn('azure-ad', {
            redirectTo: '/',
          });
        }}
      >
        <button type='submit' className='btn btn-primary btn-lg'>
          Login
        </button>
      </form>
    </>
  );
};

export default Login;
