export enum WonkErrorCodes {
  UNAUTHORIZED = '401',
  NOT_FOUND = '404',
  SERVER_ERROR = '500',
}

export const WonkErrorMessages: Record<WonkErrorCodes, WonkError> = {
  [WonkErrorCodes.UNAUTHORIZED]: {
    code: WonkErrorCodes.UNAUTHORIZED,
    name: 'Unauthorized',
    message: 'You are not authorized to view this page.',
  },
  [WonkErrorCodes.NOT_FOUND]: {
    code: WonkErrorCodes.NOT_FOUND,
    name: 'Not Found',
    message: 'The requested page was not found.',
  },
  [WonkErrorCodes.SERVER_ERROR]: {
    code: WonkErrorCodes.SERVER_ERROR,
    name: 'Server Error',
    message: 'An internal server error occurred.',
  },
};

export class WonkError extends Error {
  code: WonkErrorCodes;
  name: string;
  message: string;

  constructor(
    code: WonkErrorCodes = WonkErrorCodes.SERVER_ERROR,
    ...params: any[]
  ) {
    super(...params);
    this.code = code;
    this.name = WonkErrorMessages[code].name;
    this.message = WonkErrorMessages[code].message;
  }
}

export const handleError = (error: unknown) => {
  if (error instanceof WonkError) {
    return error;
  }

  return new WonkError();
};
