'use client';

import { WonkStatusCodes } from '../lib/error/error';
import WonkyPageError from '../lib/error/wonkyPageError';

// this is the default error component displayed when there is an uncaught error
// the only thing higher than this is the global-error, which catches errors in the layout
const Error = ({ error, reset }: { error: unknown; reset: () => void }) => {
  return <WonkyPageError status={WonkStatusCodes.SERVER_ERROR} />;
};

export default Error;
