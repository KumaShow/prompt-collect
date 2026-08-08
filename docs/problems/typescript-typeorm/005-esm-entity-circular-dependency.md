# ESM Entity 循環依賴與 `Relation<T>`

- **分類**：TypeScript + TypeORM
- **子主題**：ESM、Decorator metadata、Entity Relation
- **相關檔案**：`apps/api/src/database/entities/Category.ts`、`apps/api/src/database/entities/SkillItem.ts`、`apps/api/src/database/data-source.ts`
- **狀態**：已解決；修正後成功產生初始 migration
- **關鍵字**：`Cannot access before initialization`、`emitDecoratorMetadata`、ESM、circular dependency、`Relation<T>`

## 1. 問題現象

補上 migration 輸出路徑後，TypeORM CLI 在載入 DataSource 時失敗：

```text
Error during migration generation:
Error: Unable to open file: ".../src/database/data-source.ts".
Cannot access 'Category' before initialization
```

錯誤來源指向 `SkillItem.ts`，但 migration 指令與 PostgreSQL 連線尚未真正開始執行。

## 2. 發生原因

`Category` 與 `SkillItem` 是雙向 Relation，因此形成模組循環：

```text
data-source.ts
  └─ Category.ts
       └─ SkillItem.ts
            └─ Category.ts（尚未初始化完成）
```

原始 Relation 屬性直接使用 Entity class 作為型別：

```typescript
category!: Category;
skillItems!: SkillItem[];
```

專案同時使用 ESM 與以下 TypeScript 設定：

```json
{
  "experimentalDecorators": true,
  "emitDecoratorMetadata": true
}
```

Decorator metadata 會在 class 定義時處理 Relation 屬性的執行時型別。此時循環另一端的 Entity 可能仍處於 ESM 的初始化暫停區，因此拋出 `Cannot access 'Category' before initialization`。

`@ManyToOne(() => Category)` 雖然使用 callback 延後 TypeORM 解析目標 Entity，但原本的屬性型別 metadata 仍可能立即讀取 `Category`，所以只有 callback 並不足以避開這個錯誤。

## 3. 解決方式

使用 TypeORM 的 `Relation<T>` 包裝 Relation 屬性型別。

### `SkillItem.ts`

```typescript
import {
  Entity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Category } from './Category.js';

@ManyToOne(() => Category, (category) => category.skillItems, {
  nullable: false,
  onDelete: 'RESTRICT',
})
@JoinColumn({ name: 'categoryId' })
category!: Relation<Category>;
```

### `Category.ts`

```typescript
import { Entity, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { SkillItem } from './SkillItem.js';

@OneToMany(() => SkillItem, (skillItem) => skillItem.category)
skillItems!: Relation<SkillItem[]>;
```

`Relation<T>` 只調整 TypeScript 屬性型別與產生的 metadata，不會改變資料庫欄位、關聯方向或查詢方式。

## 4. Entity import 不能全部改成 `import type`

以下寫法不適用：

```typescript
import type { Category } from './Category.js';

@ManyToOne(() => Category)
category!: Relation<Category>;
```

原因是 `@ManyToOne(() => Category)` 在執行時需要真正的 `Category` class。`import type` 會在編譯後移除，無法提供這個 runtime value。

正確分工是：

- `Category`、`SkillItem`：保留一般 import，提供 decorator callback 需要的 Entity class。
- `Relation`：只作為型別時可以使用 `import type`。
- Relation 屬性：改為 `Relation<Category>` 或 `Relation<SkillItem[]>`。

## 5. 為什麼錯誤訊息看起來像 DataSource 打不開

TypeORM CLI 先 import `data-source.ts`，接著該檔案又 import 所有 Entity。只要任何 Entity 在模組初始化期間拋錯，CLI 就會統一顯示 `Unable to open file`。

因此應優先閱讀訊息最後面的 `[cause]`：

```text
[cause]: ReferenceError: Cannot access 'Category' before initialization
```

這次根因是 Entity 初始化，不是：

- `data-source.ts` 路徑不存在
- migration 輸出路徑錯誤
- PostgreSQL 無法連線

## 6. 驗證方式

修正後依序執行：

```bash
pnpm typecheck
pnpm migration:generate src/database/migrations/InitialSchema
```

本次 migration 已成功產生，表示：

- DataSource 可以被 TypeORM CLI 載入。
- `Category` 與 `SkillItem` metadata 可以完成初始化。
- TypeORM 可以辨識雙向一對多 Relation 並產生外鍵。

後續仍要檢查 migration SQL 是否符合資料模型，再執行 `pnpm migration:run`。

## 7. 複習重點

- `Cannot access 'X' before initialization` 通常是 ESM 模組初始化順序或循環依賴，不是 TypeScript 型別檢查錯誤。
- Relation decorator 的 callback 與屬性 decorator metadata 是兩件不同的事。
- ESM + `emitDecoratorMetadata` 的 TypeORM Entity 建議使用 `Relation<T>`。
- Entity class 必須保留 runtime import，不能因為它出現在型別位置就一律改成 `import type`。
- `Relation<T>` 不會自動載入關聯；查詢時仍需明確指定 `relations`。
