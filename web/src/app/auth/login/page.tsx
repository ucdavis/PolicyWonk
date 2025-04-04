'use server';
import React from 'react';

import { signIn } from '../../../auth';
import Logo from '../../../components/layout/logo';

export const generateMetadata = () => {
  return {
    title: 'Login',
  };
};

// Server action to handle sign in based on tenant value
async function signInHandler(formData: FormData) {
  'use server';
  // pull tenant from the button val
  const tenant = formData.get('tenant') as string;

  await signIn('boxyhq-saml', undefined, {
    tenant,
    product: 'policywonk',
  });
}

const Login: React.FC = async () => {
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
        <form action={signInHandler}>
          <div className='d-grid'>
            <button
              type='submit'
              name='tenant'
              value='ucdavis'
              className='btn btn-primary btn-lg btn-block m-2'
            >
              UC Davis
            </button>
            <button
              type='submit'
              name='tenant'
              value='ucberkeley'
              className='btn btn-primary btn-lg btn-block m-2'
            >
              UC Berkeley
            </button>
            <button
              type='submit'
              name='tenant'
              value='ucsf'
              className='btn btn-primary btn-lg btn-block m-2'
            >
              UC San Francisco
            </button>
            <button
              type='submit'
              name='tenant'
              value='ucla'
              className='btn btn-primary btn-lg btn-block m-2'
            >
              UCLA
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Login;
