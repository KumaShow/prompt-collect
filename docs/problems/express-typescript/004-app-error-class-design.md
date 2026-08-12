# AppError class 的設計：自訂錯誤欄位與 stack trace

- **紀錄代號**：express-typescript-004
- **分類**：Express + TypeScript
- **子主題**：`class`、`Error` 繼承、自訂錯誤、錯誤檔案組織
- **首次討論日期**：2026-08-12
- **最後更新日期**：2026-08-12
- **討論來源**：本次對話（Express 錯誤管理與 `AppError` class 教學）
- **相關檔案**：`apps/api/src/errors/appError.ts`、`apps/api/src/middleware/errorHandler.ts`
- **狀態**：已實作；尚未驗證
- **關鍵字**：`AppError`、`class`、`constructor`、`public readonly`、`isOperational`、`Error.captureStackTrace`

## 1. 討論問題

使用者想了解 Express 專案中的 `AppError` 自訂錯誤 class：`class` 與 `constructor` 的用途、`extends Error` 的意義、`public readonly` 的作用、`message` 為什麼交給 `super(message)`，以及 `isOperational` 和 `Error.captureStackTrace` 是否必要。也一併釐清錯誤相關檔案通常放在 `errors/` 還是 `middleware/`。

## 2. 問題現象與上下文

原本專案曾有 `apps/api/src/utils/appError.ts` 的雛形；目前工作區已有未提交變更，檔案移至：

```text
apps/api/src/errors/appError.ts
```

目前內容：

```ts
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean

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
```

本次只整理討論與現有工作區證據，未因建立本筆記而修改 `AppError` 原始碼。

## 3. 原因與關鍵觀念

- `class` 是建立物件的設計圖；`new AppError(...)` 會依設計圖建立一個錯誤物件。
- `constructor` 是物件建立時執行的初始化函式。constructor 參數若寫成 `public readonly statusCode: number`，是 TypeScript 的 parameter property 簡寫，會同時宣告屬性、接收參數並執行 `this.statusCode = statusCode`。
- `extends Error` 讓 `AppError` 保留原生 `Error` 的 `message` 與 `stack`，並增加 HTTP 狀態碼與 API 錯誤碼等欄位。
- `super(message)` 必須初始化父類別 `Error`，因此 `message` 不必再宣告成 AppError 自己的欄位。
- `public` 允許 class 外部讀取屬性；`readonly` 防止 TypeScript 程式碼在建立後重新指定這些欄位。`readonly` 是編譯期限制，不等同於執行期 `Object.freeze()`。
- `isOperational` 是團隊自訂的分類標記，用來區分可預期的業務錯誤與非預期的程式／基礎設施錯誤；它不是 JavaScript 內建功能。若所有 `AppError` 都代表可預期錯誤，可以預設為 `true`，不必每次傳入。
- `Error.captureStackTrace(this, AppError)` 是 Node.js/V8 常見功能，用來建立較乾淨的 stack，並略過 `AppError` constructor 本身，讓 log 更接近真正 `throw new AppError(...)` 的位置。它不應把 stack 回傳給前端。
- `statusCode` 與 API body 的 `status` 不是同一件事。本專案契約的錯誤 body 固定使用 `status: 'error'`，因此不需要從 status code 推導 `status: 'fail'`。

## 4. 實際建議

1. 將自訂錯誤 class 放在 `apps/api/src/errors/appError.ts`；錯誤 middleware 放在 `apps/api/src/middleware/errorHandler.ts`。前者定義錯誤物件，後者負責 HTTP response。
2. `AppError` 至少保存 `statusCode`、`code` 與繼承而來的 `message`；`isOperational` 可保留並預設為 `true`。
3. service 只拋出錯誤，不直接操作 `res`；例如：

   ```ts
   throw new AppError(401, 'INVALID_CREDENTIALS', '帳號或密碼錯誤')
   ```

4. 全域錯誤處理器對 `AppError` 使用其 `statusCode`、`code`、`message`；未知錯誤只記錄內部 log，對外回傳 `500 / INTERNAL_ERROR`。
5. 若未來建立 `NotFoundError`、`ValidationError` 等特定 class，應先確認它們代表可獨立搜尋的錯誤語意，再增加檔案，避免過早建立空的錯誤類別。

## 5. 採用與驗證結果

| 建議 | 採用狀態 | 證據或結果 |
|---|---|---|
| 將 `AppError` 放在 `src/errors/` | 已採用 | 工作區存在 `apps/api/src/errors/appError.ts` |
| 使用 `statusCode`、`code`、`isOperational` 與 `super(message)` | 已採用 | 目前 `appError.ts` 內容已包含上述欄位與初始化流程 |
| 使用 `Error.captureStackTrace` | 已採用 | 目前 `appError.ts` 已呼叫；尚未執行 runtime 或測試驗證 stack 內容 |
| 移除 `status: fail/error` 推導 | 已採用 | 目前 `AppError` 沒有該欄位，符合 `api-spec.md` 的 `status: 'error'` 契約 |
| 以測試驗證 `instanceof AppError`、錯誤 response 與未知錯誤兜底 | 待處理 | 本次未執行測試，尚無 runtime 證據 |

## 6. 容易混淆的觀念

- `message` 不是遺漏，而是由父類別 `Error` 提供；`super(message)` 會初始化它。
- constructor 內的 parameter property 與 constructor 外宣告欄位再手動賦值，主要是語法簡寫與可讀性的差異。
- `isOperational` 不會自動讓錯誤安全，也不會自動被 Express 使用；必須由 error handler 明確判斷。
- `Error.captureStackTrace` 只改善除錯資訊，不負責決定 HTTP status 或 response body。
- 目前 `AppError` 的檔名是小寫 `appError.ts`，因此 ESM import 必須精確使用 `../errors/appError.js`；部署到大小寫敏感環境時不能寫成 `AppError.js`。

## 7. 後續行動

- [ ] 補上 `AppError` 的單元測試，驗證 `message`、`statusCode`、`code`、`isOperational` 與 `stack`。
- [ ] 確認 `errorHandler` 的 Express 錯誤 middleware 簽名與未知錯誤 log 行為。
- [ ] 依實作結果決定是否需要 `NotFoundError`、`ValidationError` 等特定錯誤 class。

## 8. 複習檢查清單

- [ ] 能說明 `extends Error` 與 `super(message)` 各自負責什麼。
- [ ] 能將 parameter property 改寫成 constructor 外宣告欄位的完整版本。
- [ ] 能說明 `readonly` 與 `Object.freeze()` 的差異。
- [ ] 能說明 `isOperational` 為什麼需要由 error handler 主動使用。
- [ ] 能說明為什麼 stack 可以寫入 log，但不應直接回傳給前端。

## 9. 更新紀錄

| 日期 | 更新內容 | 驗證狀態 |
|---|---|---|
| 2026-08-12 | 首次整理 `AppError` class、欄位設計、stack trace 與錯誤檔案組織 | 已實作；尚未驗證 |
