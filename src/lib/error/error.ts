export type WonkyErrorCode = {
  code: string;
  name: string;
  description: string;
};

export enum WonkyErrorCodes {
  UNAUTHORIZED = '401',
  NOT_FOUND = '404',
  SERVER_ERROR = '500',
}

export class WonkError extends Error {
  code: string;
  name: string;
  description: string;

  constructor(code?: string, ...params: any[]) {
    super(...params);
    this.code = code ?? WonkyErrorCodes.SERVER_ERROR;

    switch (code) {
      case WonkyErrorCodes.UNAUTHORIZED:
        this.name = 'Unauthorized';
        this.description = 'You are not authorized to view this page.';
        break;
      case WonkyErrorCodes.NOT_FOUND:
        this.name = 'Not Found';
        this.description = 'The requested page was not found.';
        break;
      default:
        this.name = 'Server Error';
        this.description = 'An internal server error occurred.';
    }
  }
}

export const handleError = (error: unknown) => {
  if (error instanceof WonkError) {
    return error;
  }

  console.error('Unhandled error:', error);

  return new WonkError();
};
