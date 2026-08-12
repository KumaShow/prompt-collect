# Prompt / Skill 收藏庫

> 六角學院 Node.js Side Project（LV2）｜成果發表：2026-08-21

一個管理 AI 素材的收藏服務。**管理者**在後台建立類別與 Prompt / Skill 資料，**會員**在前台瀏覽、搜尋、篩選並收藏自己常用的項目。

完整需求見 [docs/PRD.md](docs/PRD.md)，開發排程見 [docs/TODO.md](docs/TODO.md)。

## 技術棧

| 層 | 選用 |
|---|---|
| 後端 | Node.js 24 + Express 5 + TypeScript（ESM） |
| 資料庫 | PostgreSQL + TypeORM |
| 驗證 | JWT（access / refresh 雙 token）+ bcrypt |
| 前端 | Vue 3 + Vite + Pinia + Vue Router |
| 工具鏈 | pnpm workspace（monorepo）、Vitest |

## 專案結構

```
prompt-collect/
├─ apps/
│  ├─ api/                  後端 API
│  │  ├─ src/
│  │  │  ├─ config/env.ts   環境變數驗證（單一事實來源）
│  │  │  ├─ database/       TypeORM DataSource、entities、migrations
│  │  │  ├─ routes/
│  │  │  ├─ app.ts          Express app 組裝
│  │  │  └─ server.ts       啟動入口
│  │  └─ .env.example       環境變數範本
│  └─ web/                  Vue 3 前端
├─ packages/                共用套件（預留）
├─ infra/                   基礎設施設定（預留）
└─ docs/                    PRD、開發 TODO
```

## 環境需求

- Node.js **24.x**（根 `package.json` 的 `engines` 有指定）
- pnpm **10.32.1**
- PostgreSQL（本機安裝或 Docker 皆可）

## 快速開始

```bash
# 1. 安裝依賴（在根目錄執行，pnpm workspace 會一次裝好 api 與 web）
pnpm install

# 2. 準備後端環境變數
cp apps/api/.env.example apps/api/.env
#    接著編輯 apps/api/.env，至少要改兩個 JWT secret：
#    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. 確認 PostgreSQL 已啟動，並建立 .env 裡 DB_NAME 指定的資料庫

# 4. 啟動（api + web 同時跑）
pnpm dev
```

啟動後 API 預設在 `http://localhost:3000`，前端在 Vite 預設的 `http://localhost:5173`。

## 環境變數

全部定義於 [apps/api/src/config/env.ts](apps/api/src/config/env.ts)，服務啟動時會一次驗證完畢，任何一項不合法就直接中止並印出是哪個欄位有問題。

| 變數 | 必填 | 預設 | 說明 |
|---|---|---|---|
| `NODE_ENV` | | `development` | `development` / `test` / `production` |
| `PORT` | | `3000` | API 監聽的 port |
| `CORS_ORIGIN` | ✓ | | 前端網址，需為合法 URL |
| `DB_HOST` | ✓ | | 資料庫主機 |
| `DB_PORT` | | `5432` | 本機 5432 被佔用時可改其他 port |
| `DB_USERNAME` | ✓ | | |
| `DB_PASSWORD` | | | 可留空（本機免密碼的 PostgreSQL） |
| `DB_NAME` | ✓ | | |
| `JWT_ACCESS_SECRET` | ✓ | | 至少 32 字元 |
| `JWT_ACCESS_EXPIRES_IN` | | `15m` | |
| `JWT_REFRESH_SECRET` | ✓ | | 至少 32 字元，與 access 用不同的值 |
| `JWT_REFRESH_EXPIRES_IN` | | `7d` | |
| `BCRYPT_SALT_ROUNDS` | | `10` | 允許 10~15，每 +1 雜湊耗時翻倍 |

> 想使用某個變數的預設值時，請**把整行刪掉或註解掉**。留下 `PORT=` 這種空值不會觸發預設值，而是會被當成空字串驗證失敗。

## 常用指令

在根目錄執行：

| 指令 | 說明 |
|---|---|
| `pnpm dev` | 同時啟動 api 與 web |
| `pnpm build` | 建置所有 workspace 專案 |
| `pnpm typecheck` | 型別檢查 |
| `pnpm test` | 執行測試 |

只針對後端（在 `apps/api/` 執行）：

| 指令 | 說明 |
|---|---|
| `pnpm dev` | tsx watch 啟動，存檔即重載 |
| `pnpm migration:generate src/database/migrations/<Name>` | 依 entity 差異產生 migration |
| `pnpm migration:run` | 執行 migration |
| `pnpm migration:revert` | 回滾最後一次 migration |

## 開發慣例

**ESM 的 import 要帶 `.js` 副檔名**

專案是 ESM（`"type": "module"`）搭配 `moduleResolution: NodeNext`，所有相對路徑 import 都必須寫 `.js`，即使來源檔是 `.ts`：

```ts
import { env } from '../config/env.js'   // 指向 config/env.ts
```

`.js` 對應的是編譯後 `dist/` 的實體檔名。省略會得到 `TS2835`。

**環境變數一律走 `env`，不要直接讀 `process.env`**

```ts
import { env } from '../config/env.js'

env.DB_PORT        // number，已驗證且保證存在
process.env.DB_PORT // string | undefined，繞過所有驗證
```

**設定的值與規則分開放**

| 位置 | 放什麼 | 進 git |
|---|---|---|
| `.env` | 這台機器的實際值 | ✗ |
| `.env.example` | 欄位範本與填寫說明 | ✓ |
| `config/env.ts` | 驗證規則與預設值 | ✓ |

個人環境的偏離（例如本機 5432 被佔用要改 port）放 `.env`，不要改 `env.ts` 的 `.default()`。

## 目前進度

- [x] Phase 0 環境與專案初始化
- [ ] Phase 1 資料庫設計與 TypeORM ← 進行中
- [ ] Phase 2 登入與角色權限
- [ ] Phase 3 後台管理 API
- [ ] Phase 4 前台 API
- [ ] Phase 5 Vue 前端
- [ ] Phase 6 打磨與發表準備

## 待補

發表前需要補上（對應 TODO Phase 6）：

- [ ] API 端點一覽
- [ ] 測試帳號（admin / member）與 seed 指令
- [ ] 前後台操作流程說明
- [ ] AI 協作紀錄
