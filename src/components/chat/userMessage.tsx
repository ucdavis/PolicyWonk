'use client';
import ErrorBoundary from '@/lib/error/errorBoundary';
import WonkError from '@/lib/error/wonkError';

import { UserPortrait } from './userPortrait';

export const UserMessage = ({
  user,
  content,
}: {
  user?: string;
  content: string;
}) => {
  return (
    <div className='row mb-3'>
      <div className='col-2 col-sm-1 mb-2'>
        <ErrorBoundary>
          <UserPortrait />
        </ErrorBoundary>
      </div>
      <div className='col-10'>
        <p className='chat-name'>
          <strong>{!!user ? user : `You: `}</strong>
        </p>
        <ErrorBoundary
          fallback={
            <WonkError type='alert' thereWasAnErrorLoadingThe='question' />
          }
        >
          <p>{content}</p>
        </ErrorBoundary>
      </div>
    </div>
  );
};
