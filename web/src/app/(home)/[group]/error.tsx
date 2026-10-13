'use client';

import { WonkStatusCodes } from '@/lib/error/error';
import WonkyPageError from '@/lib/error/wonkyPageError';

const Error = ({ error, reset }: { error: unknown; reset: () => void }) => {
  return <WonkyPageError status={WonkStatusCodes.SERVER_ERROR} />;
};

export default Error;
