import type { AuthTokenPayload } from '../../modules/auth/auth.types.js';

declare module 'express' {
  interface Request {
    user?: AuthTokenPayload;
  }
}
