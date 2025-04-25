import React, { ReactNode } from 'react';

type WonkTopProps = {
  children: ReactNode;
};

const WonkTop: React.FC<WonkTopProps> = ({ children }) => {
  return (
    <div className='wonk-chat-top'>
      <div className='wonk-chat-width'>{children}</div>
    </div>
  );
};

export default WonkTop;
