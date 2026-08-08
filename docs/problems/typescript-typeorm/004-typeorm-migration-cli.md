# TypeORM migration 指令與 `<path>` 必填錯誤

- **分類**：TypeScript + TypeORM
- **子主題**：TypeORM CLI、Migration
- **相關檔案**：`apps/api/package.json`、`apps/api/src/database/data-source.ts`、`apps/api/src/database/migrations/`
- **狀態**：已排除；初始 migration 已成功產生，尚待執行
- **關鍵字**：`migration:generate`、`migration:run`、`migration:revert`、positional argument、DataSource

## 1. 問題現象

在 `apps/api` 執行以下指令：

```bash
pnpm migration:generate
```

TypeORM 顯示：

```text
cli-ts-node-esm.js migration:generate <path>
Not enough non-option arguments: got 0, need at least 1
```

## 2. 發生原因

`apps/api/package.json` 中的 script 是命令捷徑：

```json
"migration:generate": "typeorm-ts-node-esm migration:generate -d src/database/data-source.ts"
```

這段設定只指定了 DataSource，沒有固定 migration 的輸出路徑。`migration:generate` 的 `<path>` 是必填位置參數，因此執行 script 時還要自行補上檔案路徑與名稱。

## 3. 正確指令

在 `apps/api` 目錄執行：

```bash
pnpm migration:generate src/database/migrations/InitialSchema
```

pnpm 會把最後的路徑附加到 package script，實際效果相當於：

```bash
typeorm-ts-node-esm migration:generate \
  -d src/database/data-source.ts \
  src/database/migrations/InitialSchema
```

TypeORM 會自動在檔名前加入 timestamp，例如：

```text
1786184053751-InitialSchema.ts
```

呼叫時不需要手動補 `.ts`，也不要自行加入 timestamp。

## 4. Migration 指令與用途

| 指令 | 用途 | 是否連線資料庫 |
|---|---|:---:|
| `pnpm migration:create <path>` | 建立空白 migration，供開發者手動撰寫 `up`、`down` | 否 |
| `pnpm migration:generate <path>` | 比對 Entity metadata 與目前資料庫 schema，自動產生差異 | 是 |
| `pnpm migration:run` | 依序執行尚未套用的 migration | 是 |
| `pnpm migration:revert` | 執行最近一筆 migration 的 `down`，一次回復一筆 | 是 |
| `pnpm typeorm <command>` | 直接使用 TypeORM CLI 的其他功能 | 視 command 而定 |

`migration:create` 與 `migration:generate` 的差別是：前者只建立模板，不分析 Entity；後者會載入 DataSource、Entity 與資料庫後自動產生 schema 差異。

## 5. 建議操作順序

```text
確認 Entity
  ↓
migration:generate <path>
  ↓
檢查產生檔案的 up / down
  ↓
migration:run
  ↓
執行 seed
```

Migration 負責資料表結構與變更歷史；seed 負責測試資料，兩者不應混在同一份檔案。

## 6. 本次驗證結果

本次已成功產生 `1786184053751-InitialSchema.ts`，內容包含：

- `user`、`category`、`skill_item`、`favorite` 四張表
- `User.email` 唯一約束與角色檢查
- `SkillItem.categoryId` 外鍵及 `ON DELETE RESTRICT`
- `Favorite` 複合主鍵與兩個 `ON DELETE CASCADE` 外鍵
- `SkillItem.tags` 的 PostgreSQL `text[]` 空陣列預設值

目前只確認「成功產生 migration」，仍應先檢查 `up`、`down`，再執行：

```bash
pnpm migration:run
```

## 7. 排查順序

若 `migration:generate` 失敗，可依錯誤出現階段判斷：

1. 顯示 `<path>` 必填：指令缺少輸出路徑。
2. 顯示 `Unable to open file` 並附 Entity 錯誤：DataSource 或 Entity 載入失敗。
3. 顯示連線拒絕、認證失敗：PostgreSQL 或環境變數設定有問題。
4. 顯示 `No changes in database schema were found`：Entity 與目前資料庫已一致，不需要新 migration。
