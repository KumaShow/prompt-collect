# Express 錯誤處理的分層：service、controller 與 error middleware

- **紀錄代號**：express-typescript-005
- **分類**：Express + TypeScript
- **子主題**：error middleware、`next(error)`、middleware 順序、錯誤責任分工
- **首次討論日期**：2026-08-12
- **最後更新日期**：2026-08-13
- **討論來源**：本次對話（Express 錯誤管理流程教學）
- **相關檔案**：`apps/api/src/app.ts`、`apps/api/src/middleware/errorHandler.ts`、`apps/api/src/modules/auth/auth.controller.ts`、`apps/api/src/modules/auth/auth.service.ts`、`apps/api/src/errors/appError.ts`
- **狀態**：部分完成
- **關鍵字**：Express error middleware、`next(error)`、service、controller、`errorHandler`、`500`

## 1. 討論問題

使用者想了解 Express 專案如何管理錯誤，以及以下責任如何分工：為什麼 error middleware 通常放最後、service 是否應該處理 request/response、controller 如何傳遞錯誤，以及同一個 HTTP `401` 為什麼仍需要以 `code` 區分不同語意。

## 2. 問題現象與上下文

目前工作區已有未提交的錯誤處理變更：

- `apps/api/src/app.ts` 已在 `/health` route 後掛上 `app.use(errorHandler)`。
- `apps/api/src/middleware/errorHandler.ts` 已能辨識 `AppError`，並將未知錯誤轉成 `500 / INTERNAL_ERROR`。
- `apps/api/src/modules/auth/auth.controller.ts` 已在 `catch` 中呼叫 `next(err)`。
- `apps/api/src/modules/auth/auth.service.ts` 已改用 `AppError` 表達登入失敗；目前尚未以 runtime 測試驗證錯誤 response。

目前 `errorHandler.ts` 已使用 Express error middleware 的四參數簽名：

```ts
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // ...
}
```

本次建立紀錄未修改這些原始碼。

## 3. 原因與關鍵觀念

- 一般 Express middleware 通常使用 `(req, res, next)`；錯誤 middleware 的慣例簽名是 `(err, req, res, next)`。Express 會依錯誤 middleware 的四參數形式辨識它；目前程式碼已採用四參數簽名，但錯誤流程仍需要 runtime 驗證。
- `next()` 代表繼續一般 middleware chain；`next(error)` 代表發生錯誤，Express 應跳過一般 middleware，尋找後面的 error middleware。因此 error handler 通常放在 route 與 404 handler 之後。
- service 的責任是商業邏輯，例如查詢使用者、比對密碼、判斷是否重複收藏與建立業務錯誤；service 不應依賴 Express 的 `Request`、`Response` 或直接呼叫 `res.status()`。
- controller 負責從 request 取資料、呼叫 service、建立成功 response；錯誤則傳給 `next(error)`，讓統一的 error handler 負責 HTTP 回應。
- 401 只表示「未通過認證」這個 HTTP 分類；`INVALID_CREDENTIALS`（帳密錯誤）與 `UNAUTHENTICATED`（沒有登入或 token 失效）是不同業務語意，因此前端需要依 `code` 做不同處理。此 API contract 原則已記錄在 `api-contract-design-001`，本筆不重複定義。

## 4. 實際建議

推薦的 middleware 順序：

```text
helmet / cors
  → body parser
  → routes
  → notFoundHandler
  → errorHandler
```

建議流程：

1. service 發現可預期的業務問題時，拋出 `AppError`，例如 `404 / NOT_FOUND` 或 `401 / INVALID_CREDENTIALS`。
2. controller 在同步或非同步流程中使用 `next(error)` 傳遞錯誤；不要在每支 controller 重複建立錯誤 JSON 格式。
3. error handler 使用四參數簽名，先處理 `AppError`，再記錄未知錯誤並回傳通用 `500 / INTERNAL_ERROR`。
4. 若要處理不存在的 route，先掛獨立的 404 middleware，再掛 error handler；404 middleware 是正常 request flow 的結果，error handler 則處理例外。
5. 以 API contract 的 `status`、`code`、`message` 格式輸出；不要把 stack trace 或內部錯誤細節回傳給前端。

## 5. 採用與驗證結果

| 建議 | 採用狀態 | 證據或結果 |
|---|---|---|
| controller 使用 `next(error)` | 已採用 | `auth.controller.ts` 的 catch block 已呼叫 `next(err)` |
| 在 app 最後掛 error handler | 已採用 | `app.ts` 目前已執行 `app.use(errorHandler)` |
| service 改用 `AppError` 表達業務錯誤 | 已採用 | `auth.service.ts` 在查無使用者與密碼錯誤時皆拋出 `AppError(401, 'INVALID_CREDENTIALS', ...)` |
| error handler 使用 Express 四參數簽名 | 已採用；尚未驗證 runtime | `errorHandler.ts` 目前包含 `error`、`_req`、`res`、`_next` 四個參數；尚未執行整合測試確認錯誤流程 |
| 補上 404 handler 與錯誤處理測試 | 待處理 | 目前 `app.ts` 未看到獨立 404 handler，本次未執行測試 |
| 使用 `code` 區分同一 HTTP status 的不同語意 | 已採用於契約設計 | `docs/design/api-spec.md` 與 `api-contract-design-001` 已定義 `INVALID_CREDENTIALS`、`UNAUTHENTICATED` 等 code |

## 6. 容易混淆的觀念

- error handler 放最後不是因為「所有 route 都一定呼叫 `next()`」，而是 middleware 依註冊順序執行，錯誤應由前面流程透過 `next(error)` 傳到最後的錯誤處理器。
- 404 與 500 不同：找不到 route 是可預期的 HTTP 結果；500 通常代表未預期錯誤。
- service 不處理 HTTP response，但可以決定業務錯誤的語意與錯誤碼；HTTP status 的轉換交給 error handler。
- HTTP status 是數字的大分類；API `code` 是字串的具體原因；使用者看到的 `message` 不應成為前端流程判斷依據。
- `errorHandler` 檔案放在 `middleware/`，`AppError` 放在 `errors/`，是依責任分工而不是硬性目錄規則。

## 7. 後續行動

- [x] 將 `errorHandler` 改為完整的 Express error middleware 四參數簽名。
- [x] 將登入 service 的預期錯誤改為 `AppError`，避免把物件直接傳給原生 `Error`。
- [ ] 執行 API runtime / integration test，確認 `AppError` 與未知錯誤的 response。
- [ ] 新增或確認未知錯誤、`AppError`、404 route 的整合測試。
- [ ] 更新 `docs/problems/api-contract-design/001-error-code-vs-http-status.md`，若後續實作提供新的錯誤處理證據。

## 8. 複習檢查清單

- [ ] 能說明 `next()` 與 `next(error)` 的差異。
- [ ] 能說明為什麼 service 不應呼叫 `res.status()`。
- [ ] 能畫出 routes、404 handler、error handler 的註冊順序。
- [ ] 能說明 401 status 與 `INVALID_CREDENTIALS` / `UNAUTHENTICATED` 的分工。
- [ ] 能指出目前工作區中哪些錯誤處理已實作、哪些仍缺少驗證。

## 9. 更新紀錄

| 日期 | 更新內容 | 驗證狀態 |
|---|---|---|
| 2026-08-12 | 首次整理 Express 錯誤處理分層、middleware 順序與目前工作區完成度 | 部分完成 |
| 2026-08-13 | 依目前工作區更新 `AppError`、四參數 error middleware 與登入 service 的採用狀態 | 部分完成；runtime 尚未驗證 |
