import React from 'react';

// import WonkyErrorBoundary from '../../lib/error/wonkyErrorBoundary';
// import Logo from '../layout/logo';

interface ChatHeaderProps {
  children: React.ReactNode;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ children }) => {
  return (
    <div className='chat-top-home'>
      <h1>Ask PolicyWonk a question</h1>
      <br />
      {/* <WonkyErrorBoundary>
        <Logo />
      </WonkyErrorBoundary> */}
      <p className='lede'>{children}</p>
    </div>
  );
};

export default ChatHeader;
