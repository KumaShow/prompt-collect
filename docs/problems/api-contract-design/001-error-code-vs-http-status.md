# 錯誤碼設計慣例：TypeScript 型別、HTTP 狀態碼與 JSON body 的分工

- **紀錄代號**：api-contract-design-001
- **分類**：API Contract Design
- **子主題**：TypeScript 型別設計、HTTP 狀態碼、auth.md 契約審查
- **首次討論日期**：2026-08-11
- **最後更新日期**：2026-08-11
- **討論來源**：本次對話（auth.md 契約審查與 TypeScript 型別設計討論）
- **相關檔案**：`docs/design/contracts/auth.md`、`docs/design/api-spec.md`、`docs/PRD.md`、`apps/api/src/middleware/auth.ts`
- **狀態**：部分完成
- **關鍵字**：`enum`、`interface`、`type union`、HTTP status code、`VALIDATION_ERROR`、`UNAUTHENTICATED`

## 1. 討論問題

1. 一般 TypeScript + Express 專案的錯誤碼型別（例如 auth 契約裡的 `code` 欄位）通常怎麼定義？會用 `interface` 還是 `enum`？
2. `auth.md` 與 `PRD.md` 的登入錯誤定義是否有出入？
3. 使用 `res.status(200)`、`res.status(401)` 這類 HTTP 狀態碼時，JSON body 是否也要把 `200`、`401` 這種數字代號放進去？

## 2. 問題現象與上下文

- `docs/design/contracts/auth.md` 定義了 `/auth/login`、`/auth/me` 等端點的錯誤碼表，需要與 `docs/PRD.md` 第十四節、`docs/design/api-spec.md` 第二節錯誤碼表對齊。
- `auth.md` 曾經在 `/auth/me` 的 401 錯誤範例中混用「請重新登入」文案，並多帶了一個 `data: null` 欄位。

## 3. 原因與關鍵觀念

- 資料結構（如 `user`、`LoginResponse`）用 `interface`/`type` 定義；固定值集合（如錯誤碼、角色）建議用**字串聯集（string union）**而非 `enum`：不會產生額外的執行期 JS 物件、和 JSON 字串格式直接對應、適合放進前後端共用的契約套件。
- **HTTP 狀態碼（數字，如 401）只透過 `res.status()` 放在 response header**，JSON body 只放機器可讀的字串 `code`（如 `INVALID_CREDENTIALS`）。這是 `api-spec.md` G-02 已定案的慣例，不應該把狀態碼數字再重複塞進 body 的 `status` 欄位（`status` 欄位語意上是 `'success' | 'error'` 字串，不是 HTTP 數字）。
- 已確認的具體落差：
  - `auth.md` 的 `/auth/me` 錯誤範例訊息「請重新登入」與 `api-spec.md` 第二節定案的 `UNAUTHENTICATED` 訊息「請先登入」不一致。
  - 該範例多帶了 `data: null`，但 `api-spec.md` G-02 定義的錯誤格式沒有 `data` 欄位。
  - `PRD.md` 第十四節只有人類可讀的 `message`，沒有機器可讀的 `code` 欄位，實作應以 `api-spec.md` 第二節為準（此點僅為建議，尚未修改 PRD.md）。

## 4. 實際建議

1. 錯誤碼型別改用字串聯集：

   ```ts
   type AuthErrorCode =
     | 'VALIDATION_ERROR'
     | 'INVALID_CREDENTIALS'
     | 'UNAUTHENTICATED'
     | 'INTERNAL_ERROR'
   ```

2. HTTP 狀態碼只放 header，不重複放進 body：

   ```ts
   return res.status(401).json({ status: 'error', code: 'INVALID_CREDENTIALS', message: '帳號或密碼錯誤' })
   ```

3. 修正 `auth.md` 的 `/auth/me` 錯誤範例：移除 `data: null`，訊息改為「請先登入」。
4. 建議 `PRD.md` 第十四節補一欄 `code`，避免 PRD、API 文件、程式碼三方各自發展（尚未採用）。

## 5. 採用與驗證結果

| 建議 | 採用狀態 | 證據或結果 |
|---|---|---|
| `/auth/me` 錯誤範例移除 `data`、訊息改為「請先登入」 | 已採用 | [auth.md](../../design/contracts/auth.md) 目前內容已更新，經檔案讀取覆核確認 |
| 錯誤碼型別用 string union 而非 enum | 已採用 | 已套用在 `apps/api/src/modules/auth/auth.types.ts` 的 `AuthErrorCode` |
| `PRD.md` 第十四節補充 `code` 欄位 | 未採用 | `PRD.md` 尚未修改 |
| HTTP 狀態碼不重複放入 body | 已驗證 | `apps/api/src/middleware/auth.ts` 的 `unauthenticatedResponse` 只在 body 放 `code` 字串，狀態碼透過 `res.status(401)` 設定 |

## 6. 容易混淆的觀念

- `code`（字串，機器可讀）vs HTTP 狀態碼（數字，header 層級）：兩者用途不同，不要疊放在同一個欄位或互相取代。
- 401 `UNAUTHENTICATED`（未登入 / token 失效）與 401 `INVALID_CREDENTIALS`（帳密錯誤）雖然狀態碼相同，語意不同，前端要靠 `code` 而非狀態碼區分。

## 7. 後續行動

- [ ] 視需要在 `PRD.md` 第十四節補充 `code` 欄位，與 `api-spec.md` 對齊
- [ ] `/auth/login` 的 400 驗證錯誤是否要在 `auth.md` 補上 `errors` 欄位明細範例

## 8. 複習檢查清單

- [ ] 能否說出這個專案為什麼選字串聯集而非 `enum` 定義錯誤碼？
- [ ] 能否指出 HTTP 狀態碼與 JSON `code` 各自該放在哪一層？
- [ ] 能否辨認 `auth.md` 目前的錯誤範例是否符合 `api-spec.md` 的全域格式？

## 9. 更新紀錄

| 日期 | 更新內容 | 驗證狀態 |
|---|---|---|
| 2026-08-11 | 首次整理：型別設計、HTTP 狀態碼慣例、auth.md 與 PRD.md 契約審查 | 部分完成 |
