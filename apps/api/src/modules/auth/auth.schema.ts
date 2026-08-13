import { z } from 'zod';

/**
 * 使用者登入請求 body 的驗證規則。
 *
 * 目的：在進入業務邏輯前，先確保 email 格式正確且 password 長度足夠，
 * 避免不合法資料進入 controller / service，並讓錯誤訊息可統一處理。
 */
export const loginBodySchema = z.strictObject({
  // 必須是合法 email，否則拒絕請求
  email: z.email({ message: '請輸入有效的 Email' }),

  // 密碼長度至少 8 個字元，避免過短或空白資料
  password: z.string().min(8, { message: '密碼至少需要 8 個字元' }),
})

/**
 * 登入請求 body 的型別推導，供 controller / service 共用。
 */
export type LoginBody = z.infer<typeof loginBodySchema>;