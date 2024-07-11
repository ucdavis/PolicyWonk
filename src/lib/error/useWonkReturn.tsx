import NotAuthorized from '@/app/not-authorized';
import NotFound from '@/app/not-found';

import { WonkReturnObject, WonkStatusCodes } from './error';

export const useWonkReturn = <T,>(
  data: T,
  status: WonkStatusCodes
): WonkReturnObject<T> => {
  return {
    data,
    status,
  };
};

export const handleWonkReturnStatus = (status: WonkStatusCodes) => {
  if (status === WonkStatusCodes.NOT_FOUND) {
    return <NotFound />;
  }

  // if (status === WonkStatusCodes.FORBIDDEN) {
  //   return <Forbidden />;
  // }

  if (status === WonkStatusCodes.UNAUTHORIZED) {
    return <NotAuthorized />;
  }

  // if (status === WonkStatusCodes.SERVER_ERROR) {
  //   return <ServerError />;
  // }

  return null;
};
