# Seed 的 `categoryId` 與 `!`：從關聯型別到外鍵實際值

- **紀錄代號**：`typescript-typeorm-006`
- **分類**：TypeScript + TypeORM
- **子主題**：seed、`exactOptionalPropertyTypes`、`non-null assertion`、foreign key
- **首次討論日期**：2026-08-12
- **最後更新日期**：2026-08-12
- **討論來源**：Phase 1 seed script
- **相關檔案**：`apps/api/src/database/entities/Category.ts`、`apps/api/src/database/entities/SkillItem.ts`、`apps/api/src/database/seeds/seed.ts`
- **狀態**：建議方案；尚未實作
- **關鍵字**：`exactOptionalPropertyTypes`、`categoryId`、`categories[2]`、`undefined`、`!`

## 1. 討論問題

在 TypeORM seed 建立 `SkillItem` 時，為什麼 `category: categories[2]` 會被 TypeScript 擋下，而 `category: categories[2]!` 或 `categoryId: categories[2].id` 才能通過？

這個問題關係到兩件事：

- `categories[2]` 的索引值可能是 `undefined`
- `SkillItem` 的 `categoryId` 是外鍵，必須參考已存在的 `Category.id`

## 2. 問題現象與上下文

根據實際 TypeScript 錯誤，當 `save()` 送入 `DeepPartial<SkillItem>[]` 時，會出現類似以下訊息：

```text
沒有任何多載符合此呼叫。
類型 '{ title: string; category: ({ name: string; description: string; } & Category) | undefined; ... }' 無法指派給類型為具有 'exactOptionalPropertyTypes: true' 的類型 'DeepPartial<SkillItem>'。
屬性 'category' 的類型不相容。
類型 '... | undefined' 不可指派給類型 'DeepPartial<Category>'。
```

這表示 TypeScript 不只看「你寫了什麼」，還會檢查「這個值有沒有可能是 `undefined`」。

在程式中，`categories[2]` 的型別很可能是：

```ts
Category | undefined
```

若下一行直接取：

```ts
categories[2].id
```

就會觸發：

```text
物件可能是 'undefined'
```

## 3. 原因與關鍵觀念

### 3.1 `!` 不是給假的 ID，而是讓 TypeScript 暫停警告

`!` 是 non-null assertion，意思是：

```ts
const category = categories[2]!
```

本質上等於說：

> 「我確定 `categories[2]` 不是 `undefined`，請不要再對我報錯。"

它不會在執行時產生一個真正的 ID；它只是讓編譯器放行。

### 3.2 `categoryId` 才是資料庫真正需要的外鍵值

在 [apps/api/src/database/entities/SkillItem.ts](../../apps/api/src/database/entities/SkillItem.ts) 內：

```ts
@Column({ type: 'uuid', nullable: false })
categoryId!: string;
```

而 `Category.id` 定義於 [apps/api/src/database/entities/Category.ts](../../apps/api/src/database/entities/Category.ts)：

```ts
@PrimaryGeneratedColumn('uuid')
id!: string;
```

這表示：

- `Category` 是父資料
- `SkillItem` 必須引用一個已存在的 `Category.id`
- `categoryId` 不是隨便填的值，而是 Seed 流程中先建立 `Category`，再拿它的實際 `id`

### 3.3 `exactOptionalPropertyTypes` 讓 `category?: T` 更嚴格

當開啟 `exactOptionalPropertyTypes: true` 時，選填屬性不再只是「可能有、可能沒有」，而是：

- 若屬性存在，值必須是 `T`
- 若屬性缺失，則該屬性應完全不存在
- `undefined` 不視為合法值

因此，這類型：

```ts
category?: DeepPartial<Category>
```

對 TypeScript 來說，會要求：

```ts
category: undefined
```

會被明確拒絕。

這就是為什麼 `category: categories[2]` 會被擋住，而 `category: categories[2]!` 這種明確宣告「一定有值」才比較像是預期寫法。

## 4. 實際建議

### 建議 1：先建立 category，再用 `categoryId`

這是最穩且最符合資料庫關係的寫法：

```ts
const categories = await categoryRepo.save([
  { name: 'JavaScript', description: '前端與後端 JavaScript 範例' },
  { name: 'TypeScript', description: '型別安全與開發效率' },
  { name: 'Node.js', description: 'Express / API / backend 範例' },
]);

await skillRepo.save([
  {
    title: 'Express health check',
    categoryId: categories[0].id,
    tags: ['express', 'api', 'health'],
    content: '建立 GET /health 端點，回傳服務狀態。',
  },
]);
```

預期效果：

- 不需要假設 ID
- 不會踩到 `undefined` 問題
- 直接符合外鍵實際需求

### 建議 2：若用索引，先做明確檢查

```ts
const [javascriptCategory, typescriptCategory, nodeCategory] = categories;

if (!javascriptCategory || !typescriptCategory || !nodeCategory) {
  throw new Error('Seed categories are missing');
}
```

這比直接寫 `categories[2]!` 更安全，因為它會在執行時真正驗證資料是否存在。

### 建議 3：`category` 關聯物件可用，但較容易踩型別

```ts
category: javascriptCategory
```

這種寫法也可以，但在 `DeepPartial` + `exactOptionalPropertyTypes` 的前提下，TypeScript 更容易對「可能 undefined」的值提出異議。因此若要降低難度，`categoryId` 往往更適合用在 seed。

## 5. 採用與驗證結果

| 建議 | 採用狀態 | 證據或結果 |
|---|---|---|
| 先建立 category，再取 `id` 後寫入 `categoryId` | 部分採用 | 這是目前專案的資料關係與外鍵設計最直接對應；`SkillItem` 直接定義 `categoryId`，符合 [apps/api/src/database/entities/SkillItem.ts](../../apps/api/src/database/entities/SkillItem.ts) |
| 用 `!` 消除警告 | 部分採用 | 能消除 TypeScript 警告，但它只是編譯期宣告，不是實際建立 ID 的機制 |
| 直接用 `category: categories[n]` | 未採用 | 容易因 `undefined` 與 `exactOptionalPropertyTypes` 被 TypeScript 擋住 |

本次未修改程式碼，尚無實作或完整 TypeScript 編譯驗證結果；目前的結論基於 TypeORM Entity 定義與實際錯誤訊息。

## 6. 容易混淆的觀念

- `!` 不是「給一個假的值」，它只是「我知道這裡不是 `undefined`」。
- `categoryId` 不是隨便填，而是要引用已存在的 `Category.id`。
- `categories[n]` 的索引取值可能為 `undefined`，需要明確檢查或斷言。
- `category` 關聯物件與 `categoryId` 外鍵是同一個關聯的兩種表達方式，並不是完整等價的 TypeScript 型別。

## 7. 後續行動

- [ ] 在 seed 檔案中改成先存 category 再寫入 skill
- [ ] 以 `categoryId` 為主，避免 `DeepPartial` 錯誤
- [ ] 重新跑 `pnpm typecheck` 確認沒有型別錯誤

## 8. 複習檢查清單

- [ ] 能否從錯誤訊息判斷問題發生在 TypeScript 型別檢查階段？
- [ ] 是否清楚區分 `!`、`undefined` 和外鍵 `id` 的不同角色？
- [ ] 是否已確認 `categoryId` 必須引用已存在資料？

## 9. 更新紀錄

| 日期 | 更新內容 | 驗證狀態 |
|---|---|---|
| 2026-08-12 | 整理 seed `categoryId`、`!` 與 `exactOptionalPropertyTypes` 的關係與建議 | 尚未驗證 |
