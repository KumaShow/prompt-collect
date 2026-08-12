import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '@/database/data-source.js';
import { User } from '@/database/entities/User.js';
import { env } from '@/config/env.js';

export async function login(email: string, password: string) {
  // 1. 依 email 找使用者
  const user = await AppDataSource.getRepository(User).findOneBy({ email });
  // 2. 若不存在 -> 拋錯或回傳錯誤物件
  if (!user) {
    throw new Error('User not found');
  }
  // 3. bcrypt.compare(password, user.passwordHash)
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  // 4. 若失敗 -> 拋錯或回傳錯誤物件
  if (!isPasswordValid) {
    throw new Error({
      code: 'INVALID_CREDENTIALS',
      message: '帳號或密碼錯誤',
    });
  }
  // 5. 簽 JWT
  const token = jwt.sign({ userId: user.id }, env.JWT_ACCESS_SECRET, {
    expiresIn: '1h',
  });
  // 6. 回傳 { token, user }
  return { token, user };
}

// export async function getCurrentUser(userId: string) {
//   // 1. 依 userId 查使用者
//   // 2. 回傳 { id, name, email, role }
// }

// export async function logout(userId: string) {
//   // 1. 這裡通常做前端 token 清除、或未來可做 token blacklist
//   // 2. 目前 MVP 可直接回傳成功
// }
