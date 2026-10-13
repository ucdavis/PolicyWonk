import Link from 'next/link';

import { WonkStatusCodes, WonkStatusMessages } from './error';

interface WonkyPageErrorProps {
  status: WonkStatusCodes;
  newQuestionHref?: string;
}

export const WonkyPageError: React.FC<WonkyPageErrorProps> = ({
  status,
  newQuestionHref = '/',
}) => {
  const errorObj = WonkStatusMessages[status];

  return (
    <div className='flex min-h-0 flex-1 overflow-y-auto py-8 lg:py-4'>
      <section
        className='mx-auto flex w-full max-w-3xl flex-1 items-center'
        aria-labelledby='page-error-title'
      >
        <div className='w-full p-4 sm:p-6' role='alert'>
          <div className='space-y-3'>
            <div>
              <p className='text-sm font-semibold'>
                {errorObj.code} · {errorObj.name}
              </p>
              <h1 id='page-error-title' className='mt-1 text-2xl font-semibold'>
                We couldn’t complete that request
              </h1>
              <p className='mt-2'>{errorObj.message}</p>
            </div>
            <Link className='btn btn-primary' href={newQuestionHref}>
              Start a new question
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WonkyPageError;
