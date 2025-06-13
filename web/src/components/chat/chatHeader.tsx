import React from 'react';

// import WonkyErrorBoundary from '../../lib/error/wonkyErrorBoundary';

interface ChatHeaderProps {
  children: React.ReactNode;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ children }) => {
  return (
    <div className='chat-top-home'>
      <h1>Ask PolicyWonk a question</h1>

      {/* <WonkyErrorBoundary>
        
      </WonkyErrorBoundary> */}
    </div>
  );
};

export default ChatHeader;
