# TypeScript `Pick` 與 Entity 回傳型別不匹配

- **紀錄代號**：typescript-typeorm-007
- **分類**：TypeScript + TypeORM
- **子主題**：TypeScript 型別工具、Entity 回傳型別
- **首次討論日期**：2026-08-16
- **最後更新日期**：2026-08-16
- **討論來源**：TypeScript return type mismatch in categories service
- **相關檔案**：`apps/api/src/modules/categories/categories.services.ts`、`apps/api/src/database/entities/Category.ts`
- **狀態**：已實作；尚未驗證
- **關鍵字**：`Pick`、`Category[]`、`return type mismatch`

## 1. 討論問題

在 `Category` Entity 的 service 中，資料庫查詢後使用 `map` 只取 `{ id, name }`，但函式的返回型別被宣告成 `Category[]`，導致 TypeScript 判斷兩者不相容。

## 2. 問題現象與上下文

錯誤訊息為：

```text
型別 '{ id: string; name: string; }[]' 不可指派給類型 'Category[]'。
型別 '{ id: string; name: string; }' 在類型 'Category' 中缺少下列屬性: description, createdAt, updatedAt, deletedAt, skillItems
```

這表示：

- `AppDataSource.getRepository(Category).find()` 的結果是 `Category[]`
- `map(({ id, name }) => ({ id, name }))` 的結果則是 `{ id: string; name: string }[]`
- 兩者不是同一種型別，因為前者還包含 `description`、`createdAt` 等欄位

## 3. 原因與關鍵觀念

### `find()` 不是「部分欄位查詢」

TypeORM 的 `find()` 會依照 Entity 定義，回傳完整的 `Category` 物件，預設形狀是：

```ts
Category[]
```

### `map` 只是在轉換資料，不會改變資料庫查詢的原始型別

即使你寫：

```ts
return categories.map(({ id, name }) => ({ id, name }));
```

這裡得到的型別仍然是「只包含 `id` 和 `name` 的物件陣列」，而不是 `Category[]`。

### `Pick` 的用途

`Pick` 是 TypeScript 的型別工具，用來建立一個只包含部分欄位的新型別：

```ts
type CategorySummary = Pick<Category, 'id' | 'name'>;
```

這代表：

```ts
{ id: string; name: string }
```

而不是整個 `Category`。

## 4. 實際建議

### 建議 A：如果 API 只回傳摘要資料

使用 `Pick` 定義回傳型別，並讓 `map` 回傳該子集合：

```ts
import { Category } from '@/database/entities/Category.js';
import { AppDataSource } from '@/database/data-source.js';

type CategorySummary = Pick<Category, 'id' | 'name'>;

export async function getAllCategories(): Promise<CategorySummary[]> {
  const categories = await AppDataSource.getRepository(Category).find();

  return categories.map(({ id, name }) => ({ id, name }));
}
```

### 建議 B：如果 API 需要完整 Entity

直接回傳 `Category[]`，不要先 `map` 成子集合：

```ts
export async function getAllCategories(): Promise<Category[]> {
  return AppDataSource.getRepository(Category).find();
}
```

重點在於：`Pick`、`Omit`、`Partial` 都是編譯期型別工具，不會改變真實資料庫回傳的物件結構。

## 5. 採用與驗證結果

| 建議 | 採用狀態 | 證據或結果 |
|---|---|---|
| 以 `Pick<Category, 'id' | 'name'>` 定義摘要回傳型別 | 已採用 | 目前的 [apps/api/src/modules/categories/categories.services.ts](../../apps/api/src/modules/categories/categories.services.ts) 已使用 `CategorySummary = Pick<Category, 'id' | 'name'>` |
| 以 `find()` 取回完整 `Category[]` 但僅回傳需要欄位 | 已採用 | 服務層的 `map` 明確回傳 `{ id, name }`，型別與 `CategorySummary[]` 一致 |
| 透過 TypeScript 檢查確認不再有不相容錯誤 | 待處理 | 已嘗試執行 `pnpm --dir apps/api exec tsc --noEmit`，但終端在執行過程中被中斷，現階段尚無成功的型別檢查輸出證據 |

## 6. 容易混淆的觀念

- `Pick` 不是執行時轉換資料，而是編譯期型別裁切。
- `find()` 回傳的是 Entity 物件，不是「只選幾個欄位」的資料。
- `Category[]` 和 `{ id: string; name: string }[]` 雖然都像陣列，但不是同一個型別。
- 只要函式宣告的回傳型別不對，TypeScript 就會在編譯期阻止這種 assignment。

## 7. 後續行動

- [x] 確認 `Category` Entity 具備完整欄位定義
- [x] 釐清 `Pick` 的正確用途與設計邏輯
- [ ] 以型別檢查證實目前實作可通過

## 8. 複習檢查清單

- [x] 能否從錯誤訊息辨認問題發生在「回傳型別」而不是資料查詢本身？
- [x] 建議是否符合目前專案設定與 TypeORM 使用方式？
- [x] 文件狀態是否有實際證據支持？

## 9. 更新紀錄

| 日期 | 更新內容 | 驗證狀態 |
|---|---|---|
| 2026-08-16 | 建立 `Pick` 與 `Category[]` 型別不匹配問題筆記，整理根因與建議 | 尚未驗證 |
