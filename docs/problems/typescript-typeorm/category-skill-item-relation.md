# Category 與 SkillItem 的一對多 Relation

- **分類**：TypeScript + TypeORM
- **相關檔案**：`apps/api/src/database/entities/Category.ts`、`apps/api/src/database/entities/SkillItem.ts`、`apps/api/src/database/data-source.ts`
- **狀態**：規劃中；資料模型已定義，Entity 關聯尚未實作
- **關鍵字**：`@ManyToOne`、`@OneToMany`、`@JoinColumn`、foreign key、`onDelete`、Relation

## 1. 問題背景

本專案要讓管理者用類別整理 Prompt / Skill。資料模型的規則是：

- 一個 `Category` 可以包含多筆 `SkillItem`。
- 一筆 `SkillItem` 必須屬於一個 `Category`。
- `SkillItem` 的類別不可為空。
- 刪除仍有 SkillItem 的 Category 時必須阻擋刪除，避免連帶遺失 Prompt / Skill。

因此關聯為 **Category 1 : N SkillItem**。外鍵 `categoryId` 應放在「多」的一端 `SkillItem`。

```text
Category (1) ─────< SkillItem (N)
                    categoryId → Category.id
```

## 2. Relation 與資料庫外鍵的關係

TypeORM 的 Relation 讓 TypeScript Entity 能以物件方式表示資料表關聯；實際保護資料完整性的仍是資料庫外鍵。

| Entity 寫法 | 代表意義 | 是否建立外鍵欄位 |
|---|---|---|
| `@ManyToOne(() => Category)` | 多筆 SkillItem 各自屬於一個 Category | 是；此側為 owning side |
| `@OneToMany(() => SkillItem)` | 一個 Category 可取得多筆 SkillItem | 否；此側是反向導覽 |
| `@JoinColumn()` | 指定 owning side 的外鍵欄位名稱 | 由 `@ManyToOne` 建立的外鍵使用它 |

重點：在一對多關聯中，`@ManyToOne` 才是不可省略的一側。只寫 `@OneToMany` 不會產生 `categoryId` 外鍵。

## 3. Entity 建議寫法

### `SkillItem`：多對一與外鍵設定

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from './Category.js';

@Entity()
export class SkillItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Category, (category) => category.skillItems, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @Column({ type: 'varchar', length: 100, nullable: false })
  title!: string;
}
```

- 第一個 callback `() => Category` 指定關聯的目標 Entity。
- 第二個 callback `(category) => category.skillItems` 指定雙向關聯的另一端。
- `nullable: false` 對應「每筆 SkillItem 都必須有類別」。
- `onDelete: 'RESTRICT'` 對應「有 SkillItem 的類別不可刪除」。
- `@JoinColumn({ name: 'categoryId' })` 讓外鍵欄位名稱清楚固定為 `categoryId`。

### `Category`：一對多反向導覽

```typescript
import { Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { SkillItem } from './SkillItem.js';

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToMany(() => SkillItem, (skillItem) => skillItem.category)
  skillItems!: SkillItem[];
}
```

`skillItems` 不會在 `Category` 表中新增欄位；它是讓程式能從一個類別反向取得底下 SkillItem 的 Relation 屬性。

## 4. 新增資料時如何指定類別

Relation 屬性叫做 `category`，不是單純的 `categoryId` 欄位。若 API 收到 `categoryId`，可用該 ID 建立關聯：

```typescript
const skillItem = skillItemRepository.create({
  title: '撰寫產品文案',
  content: '請協助我撰寫……',
  tags: ['文案', '行銷'],
  category: { id: categoryId },
});

await skillItemRepository.save(skillItem);
```

更適合 API 的流程是先確認類別存在，才能回傳清楚的 404：

```typescript
const category = await categoryRepository.findOneBy({ id: categoryId });
if (!category) {
  throw new Error('Category not found');
}

const skillItem = skillItemRepository.create({
  title,
  content,
  tags,
  category,
});

await skillItemRepository.save(skillItem);
```

不要把「類別不存在」完全交給資料庫外鍵錯誤處理；否則 service 層容易把預期的使用者輸入錯誤變成 500。

## 5. 查詢 Relation 時的注意事項

Relation 預設不會自動載入。若要在 SkillItem 列表或詳情中一併取得類別，要明確指定：

```typescript
const skillItems = await skillItemRepository.find({
  relations: {
    category: true,
  },
});
```

取得 Category 及其底下所有 SkillItem：

```typescript
const category = await categoryRepository.findOne({
  where: { id: categoryId },
  relations: {
    skillItems: true,
  },
});
```

Relation 未載入時，`skillItem.category` 不應假設已經有值。這不是關聯失效，而是查詢沒有要求 TypeORM 一併載入。

## 6. `category` 與 `categoryId` 容易混淆的地方

| 名稱 | 層次 | 用途 |
|---|---|---|
| `category` | Entity Relation | 程式中存取完整的 Category 物件，例如 `skillItem.category.name` |
| `categoryId` | 資料庫外鍵欄位 | 儲存 `Category.id`，由 `@ManyToOne` 與 `@JoinColumn` 映射 |

一般情況下，不需要再自行新增第二個 `@Column() categoryId`，否則可能造成同一個資料庫欄位被重複映射。若只需要讀取 Relation 的 ID，可後續評估 TypeORM 的 `@RelationId`；在 MVP 階段先以 `category` Relation 和查詢條件滿足需求即可。

## 7. DataSource 與 migration

Entity 寫好後，還要在 `data-source.ts` 註冊，否則 TypeORM 不會將其納入 metadata 或 migration：

```typescript
import { Category } from './entities/Category.js';
import { SkillItem } from './entities/SkillItem.js';

entities: [User, Category, SkillItem],
```

接著產生 migration，確認 SQL 包含：

- `skill_item.categoryId`（UUID、`NOT NULL`）
- 指向 `category.id` 的外鍵
- `ON DELETE RESTRICT`

不要只依賴 Entity decorator；migration 才是資料庫結構實際變更的紀錄。

## 8. 常見誤解

- `@OneToMany` 不會自行建立外鍵；必須有對應的 `@ManyToOne`。
- `@JoinColumn` 應放在 owning side；本例是 `SkillItem.category`。
- `relations: { category: true }` 是查詢時載入 Relation，不是定義 Relation。
- `onDelete: 'RESTRICT'` 是資料庫刪除規則；`cascade: true` 則是 ORM 儲存時是否連帶儲存，兩者用途不同。
- `Category.skillItems` 不會自動有資料；必須在查詢時載入它。
- `Category` 與 Tag 的角色不同：Category 是單選的本質分類，Tag 則是可多選的特徵標記，因此不應為 Category 建多對多關聯。

## 9. 實作前後檢查清單

- [ ] `SkillItem` 是否有 `@ManyToOne` 指向 `Category`？
- [ ] `Category` 是否有對應的 `@OneToMany`？
- [ ] `@JoinColumn` 的外鍵名稱是否與 API、migration 命名一致？
- [ ] `nullable: false` 是否符合「SkillItem 必須有類別」的產品規則？
- [ ] `onDelete: 'RESTRICT'` 是否確實出現在 migration 的外鍵 SQL？
- [ ] `Category` 與 `SkillItem` 是否已加入 DataSource 的 `entities`？
- [ ] 建立 SkillItem 前，是否先檢查 `categoryId` 對應的 Category 存在？
- [ ] 列表、詳情與類別頁面的查詢，是否只在需要時指定 `relations`？
