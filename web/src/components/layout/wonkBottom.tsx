import React, { ReactNode } from 'react';

import Footer from './footer';

type WonkBottomProps = {
  children: ReactNode;
};

const WonkBottom: React.FC<WonkBottomProps> = ({ children }) => {
  return (
    <div className='wonk-bottom'>
      {children}
      <Footer />
    </div>
  );
};

export default WonkBottom;
