export enum WonkStatusCodes {
  SUCCESS = '200',
  UNAUTHORIZED = '401',
  FORBIDDEN = '403',
  NOT_FOUND = '404',
  SERVER_ERROR = '500',
}

export interface WonkErrorMessage {
  code: WonkStatusCodes;
  name: string;
  message: string;
}

export interface WonkReturnObject<T> {
  data?: T;
  status: WonkStatusCodes;
}

export const useWonkReturn = <T>(
  data: T,
  status: WonkStatusCodes
): WonkReturnObject<T> => {
  return {
    data,
    status,
  };
};

export const WonkNotFound = () => {
  return {
    status: WonkStatusCodes.NOT_FOUND,
  };
};

export const WonkForbidden = () => {
  return {
    status: WonkStatusCodes.FORBIDDEN,
  };
};

export const WonkUnauthorized = () => {
  return {
    status: WonkStatusCodes.UNAUTHORIZED,
  };
};

export const WonkServerError = () => {
  return {
    status: WonkStatusCodes.SERVER_ERROR,
  };
};

export const WonkSuccess = <T>(data: T): WonkReturnObject<T> => {
  return {
    data,
    status: WonkStatusCodes.SUCCESS,
  };
};

export const WonkStatusMessages: Record<WonkStatusCodes, WonkErrorMessage> = {
  [WonkStatusCodes.SUCCESS]: {
    code: WonkStatusCodes.SUCCESS,
    name: 'Success',
    message: '',
  },
  [WonkStatusCodes.UNAUTHORIZED]: {
    code: WonkStatusCodes.UNAUTHORIZED,
    name: 'Unauthorized',
    message: 'You are not authorized to view this page.',
  },
  [WonkStatusCodes.FORBIDDEN]: {
    code: WonkStatusCodes.FORBIDDEN,
    name: 'Forbidden',
    message: 'You do not have permission to access this page',
  },
  [WonkStatusCodes.NOT_FOUND]: {
    code: WonkStatusCodes.NOT_FOUND,
    name: 'Not Found',
    message: 'The requested page was not found.',
  },
  [WonkStatusCodes.SERVER_ERROR]: {
    code: WonkStatusCodes.SERVER_ERROR,
    name: 'Server Error',
    message: 'An internal server error occurred.',
  },
};
