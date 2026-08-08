# PostgreSQL `text[]` 欄位設計與 TypeORM `array: true`

- **分類**：TypeScript + TypeORM
- **相關檔案**：`apps/api/src/database/entities/SkillItem.ts`
- **相關欄位**：`SkillItem.tags`
- **狀態**：規劃中
- **關鍵字**：`text[]`、`array: true`、`nullable`、空陣列、PostgreSQL array literal

## 1. 問題背景

`tags` 要儲存多個標籤，Entity 目前的宣告是：

```typescript
@Column({
  type: 'text',
  array: true,
  nullable: false,
})
tags!: string[];
```

這裡同時涉及三個不同層次的設定：

| 層次 | 設定 | 意義 |
|---|---|---|
| TypeScript | `string[]` | 程式碼預期收到字串陣列 |
| TypeORM | `array: true` | 將欄位映射為資料庫陣列型別 |
| PostgreSQL | `text[] NOT NULL` | 儲存文字陣列，且不允許 `NULL` |

## 2. 目前採用的設計假設

本專案先以以下規則作為設計基準：

- `tags` 永遠是陣列，不使用 `NULL` 表示沒有標籤。
- 沒有標籤時使用空陣列 `[]`。
- 陣列元素是文字，因此資料庫型別是 `text[]`。
- Entity 新物件與資料庫欄位都應有空陣列的安全預設值。
- 若產品規則要求至少一個標籤，另外使用驗證規則處理，不依賴 `nullable: false`。

## 3. 待確認的建議寫法

若允許空陣列，Entity 可以設計為：

```typescript
@Column({
  type: 'text',
  array: true,
  nullable: false,
  default: () => 'ARRAY[]::text[]',
})
tags: string[] = [];
```

兩個預設值負責不同範圍：

- `tags: string[] = []`：建立 JavaScript 物件時的初始值。
- `default: () => 'ARRAY[]::text[]'`：資料庫在 INSERT 沒有收到欄位值時的預設值。

也可以使用 PostgreSQL 陣列字面值：

```typescript
default: () => "'{}'"
```

`'{}'` 是 PostgreSQL 的空陣列表示法；`'[]'` 是 JSON 陣列表示法，不是 PostgreSQL 陣列字面值，不能直接當成 `text[]` 的通用預設值。

## 4. `array: true` 要解決什麼問題

```typescript
type: 'text',
array: true,
```

表示欄位元素是 `text`，但欄位本身是陣列。因此 TypeORM 會對應到 PostgreSQL 的 `text[]`。

如果省略 `array: true`，資料庫欄位會被視為單一 `text`，便會與 TypeScript 的 `string[]` 不一致。`array: true` 不負責設定初始值，也不代表欄位不可為 `NULL`；這兩件事分別由 `default` 與 `nullable` 決定。

## 5. `[]`、`NULL` 與 `undefined` 的差異

| 值 | 意義 | 是否適合目前設計 |
|---|---|---|
| `[]` | 有標籤欄位，但目前沒有標籤 | 適合 |
| `['typescript']` | 有一個或多個標籤 | 適合 |
| `null` | 沒有值或未知 | 不適合，因為 `nullable: false` |
| `undefined` | JavaScript 尚未設定 | 應避免傳入資料庫 |

`!` 只會略過 TypeScript 的屬性初始化檢查，不會把 `tags` 設定成 `[]`。若新建立的 Entity 需要立即能安全使用，應使用 `= []`。

## 6. 需要驗證的開發問題

### 資料庫結構

- [ ] migration 產生的欄位是否為 `text[] NOT NULL`？
- [ ] migration 是否包含空陣列預設值？
- [ ] 已存在資料加入 `NOT NULL` 前，是否已將 `NULL` 轉成空陣列？

### Entity 與新增資料

- [ ] `new SkillItem()` 時，`tags` 是否為 `[]`？
- [ ] 未提供 `tags` 時，資料庫是否能使用預設值成功 INSERT？
- [ ] 明確傳入 `tags: []` 時，是否能正常儲存？
- [ ] 傳入 `tags: null` 時，是否會被正確拒絕？

### 查詢與更新

- [ ] 查詢後的 `tags` 是否仍是 `string[]`？
- [ ] 新增、移除單一標籤時，是否避免覆蓋其他標籤？
- [ ] 搜尋標籤時要使用精確比對、包含比對，還是多個標籤的交集？
- [ ] 是否需要對標籤去重、轉小寫與去除前後空白？

### API 驗證

- [ ] API 是否拒絕非陣列輸入，例如字串或數字？
- [ ] 每個元素是否必須是非空字串？
- [ ] 是否限制標籤數量與單一標籤長度？
- [ ] 產品規則是否要求至少一個標籤？若是，應額外檢查 `tags.length > 0`。

## 7. 學習與實作順序

1. 先確認 PostgreSQL 中 `text[]`、空陣列與 `NULL` 的差異。
2. 使用 TypeORM Entity 建立 `array: true` 與 `nullable: false` 的欄位。
3. 建立或更新 migration，確認實際產生的 SQL。
4. 分別測試省略欄位、傳入空陣列、傳入有內容陣列與傳入 `null`。
5. 再決定 API 的標籤格式、驗證規則與搜尋方式。
6. 將驗證結果與實際 SQL 錯誤補回本文件，將「規劃中」改為「已驗證」。

## 8. 常見誤解

- `array: true` 不會自動給欄位空陣列。
- `nullable: false` 不代表未提供欄位時會自動使用 `[]`。
- `!` 不會在執行時初始化 `tags`。
- 空陣列 `[]` 不等於 `NULL`。
- PostgreSQL `text[]` 與 JSON 陣列的表示法不同；`'{}'` 或 `ARRAY[]::text[]` 才是 PostgreSQL 陣列預設值的方向。

## 9. 後續延伸比較

完成基本 `text[]` 實作後，再比較下列方案：

| 方案 | 適合情境 | 後續要研究的問題 |
|---|---|---|
| PostgreSQL `text[]` | 標籤是簡單字串集合 | 陣列查詢、索引、去重 |
| PostgreSQL `jsonb` | 標籤需要額外屬性或巢狀結構 | JSON 查詢與 schema 驗證 |
| 獨立 `Tag` 資料表 | 標籤需要管理、統計或關聯 | 多對多關聯、唯一約束 |
