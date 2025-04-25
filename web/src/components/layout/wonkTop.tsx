import React, { ReactNode } from 'react';

type WonkTopProps = {
  children: ReactNode;
};

const WonkTop: React.FC<WonkTopProps> = ({ children }) => {
  return <div className='wonk-chat-top'>{children}</div>;
};

export default WonkTop;
