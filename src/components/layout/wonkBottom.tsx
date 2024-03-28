import React, { ReactNode } from 'react';

type WonkBottomProps = {
  children: ReactNode;
};

const WonkBottom: React.FC<WonkBottomProps> = ({ children }) => {
  return <div className='wonk-top'>{children}</div>;
};

export default WonkBottom;
