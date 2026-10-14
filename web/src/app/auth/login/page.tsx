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

  await signIn(DEV_AUTH_BYPASS_PROVIDER_ID, {
    redirectTo: callbackUrl,
    userId,
  } as any);
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
      <div className='mx-auto flex w-full max-w-2xl items-center px-4 py-12 md:px-8'>
        <div className='w-full rounded-box border border-main-border bg-base-100 p-6 shadow-sm md:p-8'>
          <h1 className='text-3xl font-semibold'>Welcome to PolicyWonk</h1>
          <p className='mt-3 text-lg leading-7 text-base-content/75'>
            PolicyWonk will help you answer your UC administrative policy and
            procedure questions, just login with your school below, type your
            question and voila PolicyWonk will do it’s best to answer it!
          </p>
          <h2 className='mt-7 text-lg font-semibold'>Available Campuses</h2>
          {devAuthBypassEnabled && (
            <>
              <h3 className='mt-5 text-base font-semibold'>Development</h3>
              <form action={devBypassSignInHandler}>
                <input type='hidden' name='callbackUrl' value={callbackUrl} />
                <input type='hidden' name='userId' value={devAuthUserId} />
                <div className='mt-2 grid'>
                  <button type='submit' className='btn btn-outline w-full'>
                    Dev login (user {devAuthUserId})
                  </button>
                </div>
              </form>
            </>
          )}
          <form action={signInHandler}>
            <input type='hidden' name='callbackUrl' value={callbackUrl} />
            <div className='mt-3 grid gap-2'>
              {campuses.map((campus) => (
                <button
                  key={campus.value}
                  type='submit'
                  name='tenant'
                  value={campus.value}
                  className='btn btn-primary w-full'
                >
                  {campus.name}
                </button>
              ))}
            </div>
          </form>
          <div className='mt-6 text-center text-sm text-base-content/75'>
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
          <div className='mt-8 border-t border-main-border pt-5 text-right'>
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
            <p className='mt-2 text-sm text-base-content/70'>
              Copyright &copy; All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
