import type { Request, Response, NextFunction } from 'express';
import { getAllCategories } from './categories.services.js';
// import { AppError } from '@/errors/appError.js';

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await getAllCategories();

    res.status(200).json({
      status: 'success',
      message: '查詢成功',
      data: categories,
    })
  } catch (err) {
    next(err);
  }
}