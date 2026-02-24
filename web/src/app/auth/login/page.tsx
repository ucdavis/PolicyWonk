'use server';
import React from 'react';

import Image from 'next/image';

import FooterLinks from '@/components/layout/footerLinks';
import { campuses } from '@/lib/constants';
import {
  DEV_AUTH_BYPASS_PROVIDER_ID,
  getDevAuthUserId,
  isDevAuthBypassEnabled,
} from '@/lib/devAuthBypass';

import { signIn } from '../../../auth';

const devAuthBypassEnabled = isDevAuthBypassEnabled();
const devAuthUserId = getDevAuthUserId();

export const generateMetadata = async () => {
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

// Server action to handle dev-only sign in using credentials provider.
async function devBypassSignInHandler(formData: FormData) {
  'use server';
  if (!devAuthBypassEnabled) {
    throw new Error('Dev auth bypass is disabled');
  }

  const callbackUrl = (formData.get('callbackUrl') as string) || '/';
  const userId = (formData.get('userId') as string) || devAuthUserId;

  await signIn(
    DEV_AUTH_BYPASS_PROVIDER_ID,
    { redirectTo: callbackUrl, userId } as any
  );
}

interface LoginProps {
  searchParams: { callbackUrl?: string };
}

const Login: React.FC<LoginProps> = async (props) => {
  const searchParams = await props.searchParams;
  // Get callbackUrl from URL query params
  const callbackUrl = searchParams.callbackUrl || '/';

  return (
    <>
      <div className='m-auto mt-5 row justify-content-center'>
        <div className='col-12 col-md-6 login-wrapper'>
          <h1>Welcome to PolicyWonk</h1>
          <p className='lede'>
            PolicyWonk will help you answer your UC administrative policy and
            procedure questions, just login with your school below, type your
            question and voila PolicyWonk will do it’s best to answer it!
          </p>
          <h4>Available Campuses</h4>
          {devAuthBypassEnabled && (
            <>
              <h4 className='mt-4'>Development</h4>
              <form action={devBypassSignInHandler}>
                <input type='hidden' name='callbackUrl' value={callbackUrl} />
                <input type='hidden' name='userId' value={devAuthUserId} />
                <div className='d-grid'>
                  <button
                    type='submit'
                    className='btn btn-outline-secondary btn-md btn-block m-1'
                  >
                    Dev login (user {devAuthUserId})
                  </button>
                </div>
              </form>
            </>
          )}
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
          <div className='login-footer mt-auto'>
            <FooterLinks />
            <a
              target='_blank'
              rel='noopener noreferrer'
              href='https://ucop.edu'
            >
              <Image
                width={110}
                height={55}
                src='/media/uc_wordmark_blue_official.svg'
                alt='UCOP logo'
              />
            </a>
            <p>Copyright &copy; All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
