// TODO: 若前端也需要用這組錯誤碼判斷邏輯，搬移到 packages/contracts 共用
export type AuthErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHENTICATED'
  | 'INTERNAL_ERROR';

export interface AuthTokenPayload {
  userId: string;
  role: 'member' | 'admin';
}
