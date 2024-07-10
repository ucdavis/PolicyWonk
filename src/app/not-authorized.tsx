import React from 'react';

import { WonkStatusCodes } from '@/lib/error/error';
import WonkyPageError from '@/lib/error/wonkyPageError';

const NotAuthorized: React.FC = () => {
  return <WonkyPageError error={WonkStatusCodes.UNAUTHORIZED} />;
};

export default NotAuthorized;
