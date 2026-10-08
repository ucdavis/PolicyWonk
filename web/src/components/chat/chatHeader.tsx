import React from 'react';

interface ChatHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ children, className }) => {
  return (
    <div className={`${className ?? ''}`}>
      <h1 className='text-3xl font-semibold tracking-tight md:text-4xl'>
        Ask PolicyWonk a question
      </h1>
      {children}
    </div>
  );
};

export default ChatHeader;
