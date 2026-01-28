'use client';

import ChatHeader from '../components/chat/chatHeader';
import WonkTop from '../components/layout/wonkTop';
import WonkyClientError from '../lib/error/wonkyClientError';

// this is the default error component displayed when there is an uncaught error
// the only thing higher than this is the global-error, which catches errors in the layout
const Error = ({ error, reset }: { error: unknown; reset: () => void }) => {
  return (
    <WonkTop>
      <ChatHeader>
        <WonkyClientError
          thereWasAnErrorLoadingThe='page'
          type={'text'}
          contactLink={true}
        />
      </ChatHeader>
    </WonkTop>
  );
};

export default Error;
