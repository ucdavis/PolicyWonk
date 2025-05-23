import React, { ReactNode } from 'react';

type WonkBottomProps = {
  children: ReactNode;
};

const WonkBottom: React.FC<WonkBottomProps> = ({ children }) => {
  return <>{children}</>;
};

export default WonkBottom;
