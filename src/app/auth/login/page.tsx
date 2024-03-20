import { signIn } from '@/auth';
import React from 'react';

const Login: React.FC = () => {
  return (
    <div className='container'>
      <div className='row justify-content-center mt-5'>
        <div className='col-md-6'>
          <div className='card'>
            <div className='card-body text-center'>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
