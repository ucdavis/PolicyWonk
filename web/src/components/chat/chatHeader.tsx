import React from 'react';

interface ChatHeaderProps {
  children: React.ReactNode;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ children }) => {
  return (
    <div className='chat-top-home'>
      <h1>Ask PolicyWonk a question</h1>
    </div>
  );
};

export default ChatHeader;
