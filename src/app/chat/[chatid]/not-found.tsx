import React from 'react';

import { WonkStatusCodes } from '@/lib/error/error';
import WonkyPageError from '@/lib/error/wonkyPageError';

const NotFound: React.FC = () => {
  return <WonkyPageError error={WonkStatusCodes.NOT_FOUND} />;
};

export default NotFound;
