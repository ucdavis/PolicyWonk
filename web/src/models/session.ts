import { Session } from 'next-auth';

export interface WonkSession extends Session {
  userId: number;
}
