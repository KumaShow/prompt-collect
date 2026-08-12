/**
 * 環境變數的單一事實來源。
 *
 * 啟動時一次驗證完所有設定，只要有一項不合法就直接中止 process，
 * 讓下列問題在「服務跑起來的當下」就被發現，而不是等到執行某支 API 才爆炸：
 *
 *   - 環境變數漏填    ── 例如少了 CORS_ORIGIN、DB_HOST、JWT_ACCESS_SECRET
 *   - port 不是數字   ── 例如 PORT=abc，或誤填成空字串
 *   - JWT secret 太短 ── 不足 32 字元，簽出來的 token 容易被暴力破解
 *   - 資料庫設定錯誤  ── DB_HOST 為空、DB_PORT 非正整數
 *
 * 若等到執行期才發現，代價是「有人打了登入 API 才知道 JWT secret 沒設」，
 * 錯誤會混在業務邏輯的 stack trace 裡，難以一眼定位。
 *
 * 其他模組請一律 import 此檔匯出的 env，不要直接讀 process.env：
 * env 的每個欄位都已完成型別轉換，且保證存在（不會是 undefined）。
 */

// 必須放在最前面：讓 .env 在任何模組讀取 process.env 之前就載入
import 'dotenv/config'
import { z } from 'zod'

// jwt.sign() 的 expiresIn 可接受「秒數 number」或「JWT 期間字串」；
// 這裡先收斂成我們專案允許的值，避免 .env 內的字串被視為任意 string，
// 造成 TypeScript 無法滿足 jsonwebtoken 的 overload 型別。
const jwtExpiresInSchema = z.union([
  z.number().int().positive(),
  z.enum(['15m', '1h', '7d', '30d'])
])

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(3000),

  CORS_ORIGIN: z.url(),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_USERNAME: z.string().min(1),
  DB_PASSWORD: z.string(), // 刻意不加 min(1)：本機免密碼的 PostgreSQL 也能連
  DB_NAME: z.string().min(1),

  // 兩組 secret 都要求 32 字元下限，避免用過短的字串簽 token 而被暴力破解
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: jwtExpiresInSchema.default('1h'),

  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: jwtExpiresInSchema.default('7d'),

  // 每 +1 雜湊耗時翻倍：低於 10 不安全，高於 15 會拖慢登入／註冊
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(10)
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Invalid environment variables:')
  console.error(z.treeifyError(result.error))
  process.exit(1)
}

export const env = result.data