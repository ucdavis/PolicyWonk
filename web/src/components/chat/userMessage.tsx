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
    <div className='chat-row'>
      <div className='user-message-row'>
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
