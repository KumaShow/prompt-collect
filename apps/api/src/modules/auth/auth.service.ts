import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '@/database/data-source.js';
import { User } from '@/database/entities/User.js';
import { env } from '@/config/env.js';
import { AppError } from '@/errors/appError.js';
import type { AuthTokenPayload } from './auth.types.js';

export async function login(email: string, password: string) {
  const user = await AppDataSource.getRepository(User)
    .createQueryBuilder('user')
    .addSelect('user.passwordHash')
    .where('user.email =:email', { email })
    .getOne();

  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', '帳號或密碼錯誤');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', '帳號或密碼錯誤');
  }

  const payload: AuthTokenPayload = {
    userId: user.id,
    role: user.role,
  };

  const token = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
  return { token, user };
}

export async function getCurrentUser(userId: string) {
  console.log('getCurrentUser userId:', userId);
  const user = await AppDataSource.getRepository(User).findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(401, 'UNAUTHENTICATED', '使用者不存在或已被刪除');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
