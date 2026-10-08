'use client';
import WonkyClientError from '../../lib/error/wonkyClientError';
import WonkyErrorBoundary from '../../lib/error/wonkyErrorBoundary';

export const UserMessage = ({
  user,
  content,
}: {
  user?: string;
  content: string;
}) => {
  return (
    <div className='mb-5 max-w-3xl'>
      <div className='flex justify-end'>
        <WonkyErrorBoundary
          fallback={
            <WonkyClientError
              type='alert'
              thereWasAnErrorLoadingThe='question'
            />
          }
        >
          <p className='max-w-2xl rounded-3xl bg-primary/10 px-4 py-3'>
            {content}
          </p>
        </WonkyErrorBoundary>
      </div>
    </div>
  );
};
