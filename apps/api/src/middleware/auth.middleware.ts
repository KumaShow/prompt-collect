import { type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthErrorCode, AuthTokenPayload } from '../modules/auth/auth.types.js';

const unauthenticatedResponse = (res: Response) =>
  res.status(401).json({
    status: 'error',
    code: 'UNAUTHENTICATED' as AuthErrorCode,
    message: '請先登入',
  });

export const authMiddleware = (req: Request, res: Response, next: () => void) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return unauthenticatedResponse(res);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return unauthenticatedResponse(res);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthTokenPayload;
    req.user = decoded;
    next();
  } catch {
    // 簽章錯誤與 token 過期都視為同一種未認證狀態，前端一律導回登入頁
    return unauthenticatedResponse(res);
  }
};

