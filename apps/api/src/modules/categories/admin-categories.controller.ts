import type { Request, Response, NextFunction } from 'express';
import {
  getAllCategories,
  createCategory,
} from './admin-categories.services.js';
// import { AppError } from '@/errors/appError.js';

interface CategoryRequestBody {
  name: string;
  description?: string;
}

async function getAdminCategories(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const categories = await getAllCategories();

    res.status(200).json({
      status: 'success',
      message: '查詢成功',
      data: categories,
    });
  } catch (err) {
    next(err);
  }
}

async function createAdminCategory(
  req: Request<Record<string, never>, unknown, CategoryRequestBody>,
  res: Response,
  next: NextFunction,
) {
  try {
    const categoryData: CategoryRequestBody = req.body;
    const newCategory = await createCategory(categoryData);

    res.status(201).json({
      status: 'success',
      message: '建立成功',
      data: newCategory,
    });
  } catch (err) {
    next(err);
  }
}

export { getAdminCategories, createAdminCategory };
