// https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices
// Prevent multiple instances of Prisma Client in development which can cause annoying errors
import { Prisma, PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  if (process.env.NODE_ENV === 'production') {
    return new PrismaClient();
  } else {
    // log all queries in development
    return new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });
  }
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

export enum PrismaErrorCode {
  RecordNotFound = 'P2025',
  // Add other error codes as needed
}

export const isPrismaError = (
  error: unknown,
  code?: PrismaErrorCode
): error is Prisma.PrismaClientKnownRequestError => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }
  if (!code) {
    return true;
  }
  return error.code === code;
};

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
