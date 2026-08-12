import type { Request, Response, NextFunction } from 'express';
import { login as loginService } from './auth.service.js';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
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

// export async function logout(req: Request, res: Response, next: NextFunction) {}

// export async function getMe(req: Request, res: Response, next: NextFunction) {}
