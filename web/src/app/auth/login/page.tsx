'use server';
import React from 'react';

import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';

import FooterLinks from '@/components/layout/footerLinks';

import Ucoplogo from '/public/media/uc_wordmark_blue_official.svg';

import { signIn } from '../../../auth';

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
      <div className='mt-5 row justify-content-center'>
        <div className='col-12 col-md-6'>
          <h1>Welcome to PolicyWonk</h1>
          <p className='lede'>
            PolicyWonk will help you answer your UC administrative policy and
            procedure questions, just login with your school below, type your
            question and voila PolicyWonk will do it’s best to answer it!
          </p>
          <h4>Available Campuses</h4>
          <form action={signInHandler}>
            <input type='hidden' name='callbackUrl' value={callbackUrl} />
            <div className='d-grid'>
              {campuses.map((campus) => (
                <button
                  key={campus.value}
                  type='submit'
                  name='tenant'
                  value={campus.value}
                  className='btn btn-primary btn-md btn-block m-1'
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
              if you would like to use PolicyWonk.
            </small>
          </div>
        </div>
      </div>
      <div className='login-footer mt-auto'>
        <FooterLinks />
        <a target='_blank' rel='noopener noreferrer' href='https://ucop.edu'>
          <Image width={110} src={Ucoplogo} alt='UCOP logo' />
        </a>
        <p>Copyright &copy; All rights reserved.</p>
      </div>
    </>
  );
};

export default Login;
