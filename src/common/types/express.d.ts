import { AuthSession, SessionUser } from '../../modules/auth/auth.config';

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      session?: AuthSession['session'];
    }
  }
}

export {};
