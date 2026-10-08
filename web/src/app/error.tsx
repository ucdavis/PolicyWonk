'use client';

import ChatHeader from '../components/chat/chatHeader';
import WonkyClientError from '../lib/error/wonkyClientError';

// this is the default error component displayed when there is an uncaught error
// the only thing higher than this is the global-error, which catches errors in the layout
const Error = ({ error, reset }: { error: unknown; reset: () => void }) => {
  return (
    <div className='min-h-0 flex-1 overflow-y-auto pt-4'>
      <div className='mx-auto w-full max-w-3xl'>
        <ChatHeader>
          <WonkyClientError
            thereWasAnErrorLoadingThe='page'
            type='text'
            contactLink={true}
          />
        </ChatHeader>
      </div>
    </div>
  );
};

export default Error;
