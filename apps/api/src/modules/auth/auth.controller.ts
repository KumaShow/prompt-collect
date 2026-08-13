import type { Request, Response, NextFunction } from 'express';
import {
  login as loginService,
  getCurrentUser as getCurrentUserService,
} from './auth.service.js';
import { loginBodySchema } from './auth.schema.js';
import { AppError } from '@/errors/appError.js';

/**
 * 使用者登入。
 *
 * 流程：
 * 1. 驗證 request body 是否符合 loginBodySchema
 * 2. 若驗證失敗，拋出 400 AppError
 * 3. 將通過驗證的 email / password 交給 service
 * 4. 成功後回傳 JWT 與使用者基本資料
 */
export async function login(
  req: Request<Record<string, never>, unknown, unknown>,
  res: Response,
  next: NextFunction,
) {
  try {
    // 先做請求資料驗證，避免無效資料進入業務邏輯
    const result = loginBodySchema.safeParse(req.body);

    // 若 body 不符合 schema，直接回傳 400，並附上第一個錯誤訊息
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? '輸入資料有誤';

      throw new AppError(400, 'VALIDATION_ERROR', message);
    }

    // 由 zod 確認資料型別後，才能安全地取出 email / password
    const { email, password } = result.data;
    const { token, user } = await loginService(email, password);

    res.status(200).json({
      status: 'success',
      message: '登入成功',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export function logout(req: Request, res: Response) {
  res.status(200).json({
    status: 'success',
    message: '登出成功',
    data: null,
  });
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(401, 'UNAUTHENTICATED', '請先登入');
    }

    const user = await getCurrentUserService(userId);

    res.status(200).json({
      status: 'success',
      message: '取得使用者資訊成功',
      data: {
        user,
      },
    });
  } catch (err) {
    next(err);
  }
}
