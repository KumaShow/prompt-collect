# Express Request 型別擴充（declare module）與型別檔案組織慣例

- **紀錄代號**：express-typescript-002
- **分類**：Express + TypeScript
- **首次討論日期**：2026-08-11
- **最後更新日期**：2026-08-11
- **討論來源**：本次對話（auth.middleware.ts middleware 重構）
- **相關檔案**：`apps/api/src/middleware/auth.middleware.ts`、`apps/api/src/types/express/index.d.ts`、`apps/api/src/modules/auth/auth.types.ts`
- **狀態**：已驗證
- **關鍵字**：`declare module`、ambient declaration、Request augmentation、`tsconfig include`

## 1. 討論問題

`authMiddleware` 裡的 `AuthErrorCode`、`AuthTokenPayload`、`declare module 'express'` 這類型別是否需要拆出去獨立管理？一般 Express + TypeScript 專案怎麼安排這些型別檔案？

## 2. 問題現象與上下文

原本三個型別 / 宣告都直接寫在 `apps/api/src/middleware/auth.middleware.ts` 裡，與 middleware 的實際邏輯混在同一支檔案。

## 3. 原因與關鍵觀念

- `declare module 'express'` 是 TypeScript 的 **declaration merging（宣告合併）**，用來替 Express 原生的 `Request` 型別擴充自訂欄位（例如 `user`），讓全專案都能用型別安全的方式存取 `req.user`，不需要 `as any`。
- 常見的型別檔案分類方式：
  - 只有單一模組使用的領域型別 → 跟模組放在一起（如 `modules/auth/auth.types.ts`）
  - Express 型別擴充 → 獨立的 `.d.ts` 環境宣告檔（例如 `src/types/express/index.d.ts`），因為它是型別擴充宣告而非一般邏輯
  - 跨前後端共用的契約型別 → 共用套件（此專案是 `packages/contracts`，目前僅為空殼，尚未啟用）
- `apps/api/tsconfig.json` 的 `include: ["src/**/*.ts", "tests/**/*.ts"]` 會涵蓋 `.d.ts` 檔案（`.d.ts` 檔名符合 `*.ts` 的 glob），因此宣告合併會自動套用到整個編譯範圍，不需要在其他檔案手動 import 這支宣告檔。

## 4. 實際建議

1. 新增 `apps/api/src/modules/auth/auth.types.ts`：放 `AuthErrorCode`（附 `TODO:` 註解提醒未來是否搬進 `packages/contracts`）與 `AuthTokenPayload`。
2. 新增 `apps/api/src/types/express/index.d.ts`：只放 `declare module 'express'` 的 `Request.user` 擴充，import `AuthTokenPayload` 型別。
3. `auth.middleware.ts` 改為 `import type { AuthErrorCode, AuthTokenPayload } from '../modules/auth/auth.types.js'`，middleware 邏輯本身不變。

## 5. 採用與驗證結果

| 建議 | 採用狀態 | 證據或結果 |
|---|---|---|
| 拆出 `auth.types.ts` | 已採用 | 檔案已建立，`get_errors` 檢查無錯誤 |
| 拆出 `types/express/index.d.ts` | 已採用 | 檔案已建立，`get_errors` 檢查無錯誤 |
| `auth.middleware.ts` 改為 import 型別 | 已採用 | `auth.middleware.ts` 目前內容已改為 `import type`，經檔案讀取覆核確認 |

## 6. 容易混淆的觀念

- `declare module` 擴充別人套件的型別，和自己定義 `interface` / `type` 是不同機制；前者需要放在會被 `tsconfig` `include` 涵蓋到的檔案裡才會生效，且不需顯式 import 就能作用於全域。
- `AuthErrorCode` 雖然目前放在 `modules/auth/auth.types.ts`，但因為它本質是「跨前後端的 API 契約」，長期應考慮搬進 `packages/contracts`；目前先用 `TODO` 註解標記，不強制立刻搬移。

## 7. 後續行動

- [ ] 前端若開始需要用 `AuthErrorCode` 做錯誤判斷，將它搬進 `packages/contracts` 並設定 workspace 匯出

## 8. 複習檢查清單

- [ ] 能否說出 `declare module 'express'` 為什麼要放在 `.d.ts` 而不是一般 `.ts`？
- [ ] 能否說出這個專案裡，領域型別、全域型別擴充、跨前後端契約型別，各自該放哪裡？

## 9. 更新紀錄

| 日期 | 更新內容 | 驗證狀態 |
|---|---|---|
| 2026-08-11 | 首次整理：Express Request 型別擴充拆分 | 已驗證 |
