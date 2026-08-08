# Entity 屬性未初始化與 `!` 的用途

- **分類**：TypeScript + TypeORM
- **相關檔案**：`apps/api/src/database/entities/SkillItem.ts`
- **關鍵字**：`strictPropertyInitialization`、definite assignment assertion、`nullable`、TypeORM Entity

## 1. 問題現象

`SkillItem` 的 `exampleInput` 宣告為 `string | null`，但沒有初始化，也沒有在建構函式中明確指派：

```typescript
@Column({
  type: 'text',
  nullable: true,
})
exampleInput: string | null;
```

TypeScript 因此可能出現：

> 屬性 `exampleInput` 沒有初始設定式，且未在建構函式中明確指派。

## 2. 發生原因

當 `strictPropertyInitialization` 開啟時，TypeScript 要求類別屬性必須符合下列其中一種條件：

- 宣告時提供初始值
- 在建構函式中指派
- 使用 `!` 明確告知編譯器「稍後一定會初始化」

`string | null` 只代表「值可以是字串或 `null`」，不代表屬性本身已經被初始化。未初始化的屬性在執行時仍可能是 `undefined`。

## 3. 解決方式

### 方式 A：使用 `!`

適合由 TypeORM 從資料庫載入，或由其他生命週期流程保證設定的欄位：

```typescript
@Column({
  type: 'text',
  nullable: true,
})
exampleInput!: string | null;
```

`!` 是 TypeScript 的編譯期宣告，不會在執行時設定值，也不會讓 TypeORM 自動填入 `null`。

### 方式 B：提供預設值

如果新建立的 Entity 在初始狀態就應該是 `null`，建議明確初始化：

```typescript
@Column({
  type: 'text',
  nullable: true,
})
exampleInput: string | null = null;
```

這樣可以避免新物件的欄位是 `undefined`，語意也更清楚。

### 方式 C：在建構函式中初始化

如果欄位是建立 Entity 時的必要資料，可以使用建構函式：

```typescript
@Column({ type: 'varchar', length: 100 })
title: string;

constructor(title: string) {
  this.title = title;
}
```

但使用 TypeORM Entity 時，要注意 ORM 可能需要無參數建構方式，因此實際使用前應確認目前的 Entity 建立流程。

## 4. `!` 與 TypeORM 的關係

| 寫法 | TypeScript 行為 | 執行時初始值 | 適用情境 |
|---|---|---|---|
| `field!: string` | 略過未初始化檢查 | 不會自動設定 | TypeORM 或其他流程保證稍後載入 |
| `field: string` | `null = null` | 通過初始化檢查 | `null` | 欄位初始值就是 `null` |
| `field: string` + 建構函式 | 強制建立時提供 | 建構函式指定的值 | 必填欄位 |

TypeORM 會在查詢資料時將資料庫欄位載入 Entity，但 `!` 本身不是 TypeORM 指令。儲存可為 `null` 的欄位時，若要明確儲存 `null`，應指派 `null`，不要只依賴 `!`。

## 5. 本專案的額外檢查重點

### `nullable` 與 TypeScript 型別應保持一致

目前 `content` 設定為資料庫不可為 `NULL`，但 TypeScript 型別仍包含 `null`：

```typescript
@Column({
  type: 'text',
  nullable: false,
})
content!: string | null;
```

如果資料庫規則是必填，較一致的寫法是：

```typescript
content!: string;
```

相反地，`nullable: true` 的欄位若資料庫查詢結果可能是 `null`，TypeScript 型別就應包含 `null`，例如 `useCase!: string | null`。

### 陣列欄位也要考慮 `NULL`

`tags` 設定為 `nullable: true`，但型別是 `string[]`：

```typescript
@Column({
  type: 'text',
  array: true,
  nullable: true,
})
tags!: string[];
```

若資料庫允許 `NULL`，型別可考慮改為：

```typescript
tags!: string[] | null;
```

若應該永遠是空陣列或包含標籤，則可改用非 `NULL` 設計，並設定適當的預設值。這是資料庫規則與應用程式型別必須共同決定的設計，不應只為了消除錯誤而加上 `!`。

## 6. 複習重點

- `nullable: true` 是資料庫欄位規則；`string | null` 是 TypeScript 型別規則，兩者應互相對應。
- `!` 只會關閉屬性初始化檢查，不會初始化值。
- TypeORM 會在載入資料時設定 Entity 欄位，但不代表新建立的物件已有所有欄位值。
- 真正需要初始值時，使用 `= null`、`= []` 或建構函式，比單純使用 `!` 更安全。
- `nullable: false` 的欄位通常不應在 TypeScript 型別中保留 `null`。

## 7. 修改前檢查清單

- [ ] 這個欄位由誰初始化：建構函式、TypeORM、資料庫，還是服務層？
- [ ] 執行時的初始狀態應該是 `undefined`、`null`、空陣列，還是必填值？
- [ ] TypeScript 型別是否反映資料庫的 `nullable` 設定？
- [ ] `!` 是否只是用來掩蓋尚未釐清的初始化流程？
- [ ] 新增資料與查詢既有資料時，欄位行為是否一致？
