import React from 'react';

// import WonkyErrorBoundary from '../../lib/error/wonkyErrorBoundary';
// import Logo from '../layout/logo';

interface ChatHeaderProps {
  children: React.ReactNode;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ children }) => {
  return (
    <div className='wonk-chat-width'>
      <p>Focus chooser</p>
      <h1>Ask Policy Wonk a question</h1>
      {/* <WonkyErrorBoundary>
        <Logo />
      </WonkyErrorBoundary> */}
      <p className='lede'>{children}</p>
    </div>
  );
};

export default ChatHeader;
