'use client';
import WonkyClientError from '@/lib/error/wonkyClientError';
import WonkyErrorBoundary from '@/lib/error/wonkyErrorBoundary';

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
        <WonkyErrorBoundary>
          <UserPortrait for={user} />
        </WonkyErrorBoundary>
      </div>
      <div className='col-10'>
        <p className='chat-name'>
          <strong>{!!user ? user : `You: `}</strong>
        </p>
        <WonkyErrorBoundary
          fallback={
            <WonkyClientError
              type='alert'
              thereWasAnErrorLoadingThe='question'
            />
          }
        >
          <p>{content}</p>
        </WonkyErrorBoundary>
      </div>
    </div>
  );
};
