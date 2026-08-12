# JWT payload 型別要對照 Entity 主鍵型別，不能憑空假設

- **紀錄代號**：express-typescript-001
- **分類**：Express + TypeScript
- **首次討論日期**：2026-08-11
- **最後更新日期**：2026-08-11
- **討論來源**：本次對話（auth.ts middleware 型別修正）
- **相關檔案**：`apps/api/src/middleware/auth.ts`、`apps/api/src/modules/auth/auth.types.ts`、`apps/api/src/database/entities/User.ts`
- **狀態**：已驗證
- **關鍵字**：JWT payload、UUID、`PrimaryGeneratedColumn`、`any` 型別

## 1. 討論問題

使用者詢問「為什麼 `userId` 會是 `number` 型別？」，因而重新檢查 `AuthTokenPayload` 的定義依據。

## 2. 問題現象與上下文

在修正 `apps/api/src/middleware/auth.ts` 的 lint 錯誤（消除 `any`）時，定義了：

```ts
interface AuthTokenPayload {
  userId: number;
  role: 'member' | 'admin';
}
```

`userId: number` 是憑一般專案慣例（自動遞增整數主鍵）假設寫的，未對照這個專案實際的 `User` Entity。

## 3. 原因與關鍵觀念

查看 [User.ts](../../../apps/api/src/database/entities/User.ts) 後確認：

```ts
@PrimaryGeneratedColumn('uuid')
id!: string;
```

`User.id` 使用 `PrimaryGeneratedColumn('uuid')`，是 UUID 字串（例如 `a1b2c3d4-...`），不是自動遞增整數，因此 JWT payload 裡對應的 `userId` 也必須是 `string`，不是 `number`。

## 4. 實際建議

定義型別前，先查對應的 TypeORM Entity 的主鍵欄位型別，不要憑常見慣例猜測。

## 5. 採用與驗證結果

| 建議 | 採用狀態 | 證據或結果 |
|---|---|---|
| `AuthTokenPayload.userId` 改為 `string` | 已採用 | `apps/api/src/modules/auth/auth.types.ts` 目前定義為 `userId: string`，`get_errors` 檢查通過 |

## 6. 容易混淆的觀念

- `@PrimaryGeneratedColumn()`（預設遞增整數）與 `@PrimaryGeneratedColumn('uuid')`（UUID 字串）回傳型別不同，對應到 TypeScript 分別是 `number` 與 `string`。
- 定義跨模組共用型別（如 JWT payload）時，該型別的「事實來源」應該是資料庫 Entity，而不是憑空假設或抄其他專案的慣例。

## 7. 後續行動

- [ ] 待 `auth.service.ts` 實作 login / 簽發 JWT 時，簽發的 payload 需與 `AuthTokenPayload` 型別一致（目前 `auth.service.ts` 為空檔案，尚未實作）

## 8. 複習檢查清單

- [ ] 能否說出這個專案的 `User` 主鍵型別與原因？
- [ ] 定義型別前，習慣先查哪個檔案作為事實來源？

## 9. 更新紀錄

| 日期 | 更新內容 | 驗證狀態 |
|---|---|---|
| 2026-08-11 | 首次整理：JWT payload 型別修正 `userId` `number`→`string` | 已驗證 |
