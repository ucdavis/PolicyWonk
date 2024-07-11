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

/**
 * @param data - the data to return, or `true` if you don't want to send data
 * @returns `{ data, 'status': '200'}`
 */
export const WonkSuccess = <T>(data: T): WonkReturnObject<T> => {
  return {
    data,
    status: WonkStatusCodes.SUCCESS,
  };
};

/**
 * @returns boolean of if the status is `200` and the data is not undefined
 * if you don't want to send data, use `WonkSuccess(true)`
 */
export const isWonkSuccess = <T>(
  result: WonkReturnObject<T>
): result is WonkReturnObject<T> & { data: T } => {
  return result.status === WonkStatusCodes.SUCCESS && result.data !== undefined;
};

/**
 * @returns `{ 'status': '401'}`
 */
export const WonkUnauthorized = () => {
  return {
    status: WonkStatusCodes.UNAUTHORIZED,
  };
};

/**
 * @returns `{ 'status': '403'}`
 */
export const WonkForbidden = () => {
  return {
    status: WonkStatusCodes.FORBIDDEN,
  };
};

/**
 * @returns `{ 'status': '404'}`
 */
export const WonkNotFound = () => {
  return {
    status: WonkStatusCodes.NOT_FOUND,
  };
};

/**
 * @returns `{ 'status': '500'}`
 * We use an error instead of a return object because we want to try/catch
 */
export const WonkServerError = () => {
  return {
    status: WonkStatusCodes.SERVER_ERROR,
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
    message: 'You are not authorized to access this content.',
  },
  [WonkStatusCodes.FORBIDDEN]: {
    code: WonkStatusCodes.FORBIDDEN,
    name: 'Forbidden',
    message: 'You do not have permission to access this content',
  },
  [WonkStatusCodes.NOT_FOUND]: {
    code: WonkStatusCodes.NOT_FOUND,
    name: 'Not Found',
    message: 'The requested content was not found.',
  },
  [WonkStatusCodes.SERVER_ERROR]: {
    code: WonkStatusCodes.SERVER_ERROR,
    name: 'Server Error',
    message: 'An internal server error occurred.',
  },
};
