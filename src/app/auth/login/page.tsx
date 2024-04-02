import React from 'react';

import { signIn } from '@/auth';

const Login: React.FC = () => {
  return (
    <>
      <div className='col-10 login-card'>
        <img
          className='img-fluid mb-2'
          width={55}
          src='/media/policy-wonk.svg'
          alt='cartoon robot'
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
