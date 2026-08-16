import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/appError.js';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      status: 'error',
      code: error.code,
      message: error.message,
      ...(error.errors ? { errors: error.errors } : {}),
    });
    return;
  }

  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_ERROR',
    message: '系統發生錯誤，請稍後再試',
  });
}
