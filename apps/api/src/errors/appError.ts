/**
 * 應用程式自訂錯誤類別。
 *
 * 用於統一 API 錯誤格式，讓控制器或 middleware
 * 可以依照 `statusCode`、`code` 與 `message` 進行一致的錯誤處理。
 */
export class AppError extends Error {
  /** HTTP 狀態碼，例如 400、401、404、500 */
  public readonly statusCode: number

  /** 自訂錯誤代碼，例如 INVALID_TOKEN、NOT_FOUND */
  public readonly code: string

  /** 是否為可預期的業務錯誤；true 表示可處理的錯誤 */
  public readonly isOperational: boolean

  /**
   * 建立一個應用程式層級的錯誤。
   *
   * @param statusCode HTTP 狀態碼
   * @param code 自訂錯誤代碼
   * @param message 錯誤訊息
   * @param isOperational 是否為業務可預期錯誤，預設為 true
   */
  constructor(
    statusCode: number,
    code: string,
    message: string,
    isOperational = true,
  ) {
    super(message)

    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational

    Error.captureStackTrace(this, AppError)
  }
}
