import React from 'react';

import Image from 'next/image';

import Logo from '/public/media/policy-wonk.svg';

import { signIn } from '@/auth';

const Login: React.FC = () => {
  return (
    <>
      <div className='home-message'>
        <Image
          className='img-fluid policy-png mb-4'
          src={Logo}
          alt='Aggie Gold Robot cartoon'
        />
        <h1>Welcome to Policy Wonk</h1>
        <p className='lede'>
          This tool will help you answer your UCD policy questions, just login,
          type your question and viola Policy Wonk will do it's best to answer
          it!
        </p>
        <form
          action={async () => {
            'use server';
            // TODO: get the callbackUrl from the query params

            await signIn('azure-ad', {
              redirectTo: '/',
            });
          }}
        >
          <div className='d-grid'>
            <button type='submit' className='btn btn-primary btn-lg btn-block'>
              UC Login
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Login;
