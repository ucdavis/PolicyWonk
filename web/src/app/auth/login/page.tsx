'use server';
import React from 'react';

import { signIn } from '../../../auth';
import Logo from '../../../components/layout/logo';

// supported campuses for the login page w/ tenant values
const campuses = [
  { name: 'UC Davis', value: 'ucdavis' },
  // { name: 'UC Berkeley', value: 'ucberkeley' },
  { name: 'UC San Francisco', value: 'ucsf' },
];

export const generateMetadata = () => {
  return {
    title: 'Login',
  };
};

// Server action to handle sign in based on tenant value and callbackUrl
async function signInHandler(formData: FormData) {
  'use server';
  // pull tenant and callbackUrl from the submitted form data
  const tenant = formData.get('tenant') as string;
  const callbackUrl = (formData.get('callbackUrl') as string) || '/';

  await signIn(
    'boxyhq-saml',
    { redirectTo: callbackUrl },
    {
      tenant,
      product: 'policywonk',
    }
  );
}

interface LoginProps {
  searchParams: { callbackUrl?: string };
}

const Login: React.FC<LoginProps> = async ({ searchParams }) => {
  // Get callbackUrl from URL query params
  const callbackUrl = searchParams.callbackUrl || '/';

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
          <input type='hidden' name='callbackUrl' value={callbackUrl} />
          <div className='d-grid'>
            {campuses.map((campus) => (
              <button
                key={campus.value}
                type='submit'
                name='tenant'
                value={campus.value}
                className='btn btn-primary btn-lg btn-block m-2'
              >
                {campus.name}
              </button>
            ))}
          </div>
        </form>
        <div className='mt-4 text-center'>
          <small>
            Don&apos;t see your campus listed?{' '}
            <a
              href='https://caeshelp.ucdavis.edu/?appname=PolicyWonk'
              target='_blank'
              rel='noopener noreferrer'
            >
              Contact us
            </a>{' '}
            if you would like to use Policy Wonk.
          </small>
        </div>
      </div>
    </>
  );
};

export default Login;
