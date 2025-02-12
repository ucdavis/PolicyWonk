import React from 'react';

import { signIn } from '../../../auth';
import Logo from '../../../components/layout/logo';

export const generateMetadata = () => {
  return {
    title: 'Login',
  };
};

const Login: React.FC = () => {
  return (
    <>
      <div className='home-message'>
        <Logo />
        <h1>Welcome to Policy Wonk</h1>
        <p className='lede'>
          This tool will help you answer your UC Davis administrative policy and
          procedure questions, just login, type your question and voila
          PolicyWonk will do it’s best to answer it!
        </p>
        <br />
        <br />
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
