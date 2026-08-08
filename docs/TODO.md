# 開發 TODO — Prompt / Skill 收藏庫

> 依據 [PRD.md](./PRD.md) 拆解的分階段開發清單。
> 開發者：獨立開發（Vue 前端工程師，Node.js 初學者）
> 今天：2026-08-08 ｜ 成果發表：2026-08-21（**剩 13 天**，目前仍在完成 Phase 1）

## 已確定的技術決策

| 項目 | 決定 | 理由備註 |
|---|---|---|
| 後端 | Node.js + Express + TypeScript | 學習主目標 |
| 驗證 | JWT（`jsonwebtoken`） | 前後端分離友善 |
| 資料庫 | PostgreSQL + TypeORM | PRD 加分項直接做 |
| 前端 | Vue 3 SPA + Tailwind CSS | 既有強項，壓縮開發時間 |
| 結構 | Monorepo：`api/` + `web/` | 單人開發最好管理 |
| 密碼 | bcrypt 雜湊 | PRD 硬性要求 |

## 與 AI 的協作方式（提醒自己）

- 請 AI **先問我怎麼想**，再點評我的設計，不要直接給完整程式碼。
- 卡關時先自己嘗試 30 分鐘，再帶著「我試了什麼、錯誤訊息是什麼」去問。
- 每個階段結束時，請 AI 用提問方式檢驗我是否真的理解（例如：為什麼 middleware 順序重要？）。
- 隨手記錄 AI 幫了什麼、哪些是自己判斷 → 發表要用（PRD 第二十四節）。

---

## Phase 0：環境與專案初始化（7/30 - 7/31，約 2 天）

**學習目標**：理解 Node.js 專案的組成（package.json、tsconfig、scripts），跑起第一個 Express server。

- [x] 安裝環境：Node.js LTS、PostgreSQL（本機或 Docker）、確認 `node -v`、`psql` 可用
- [x] 建立 monorepo 結構：根目錄 + `api/` + `web/`
- [x] `api/`：初始化 `package.json`，安裝 express、typescript、ts-node-dev（或 tsx），設定 `tsconfig.json`
- [x] 實作 `GET /health` 回傳服務狀態（PRD FR-01）
- [x] 設定 `dotenv` 管理環境變數（port、之後的 DB 連線字串、JWT secret）
- [x] 建立 git repo，寫第一個 commit，加上 `.gitignore`（node_modules、.env）

**引導問題（自己先想，再找答案）**
- `dependencies` 和 `devDependencies` 差在哪？typescript 該放哪邊？
- 為什麼 `.env` 不能進 git？那別人 clone 後怎麼知道要設哪些變數？（提示：`.env.example`）

**驗收**：`npm run dev` 啟動後，瀏覽器打 `http://localhost:3000/health` 看到 JSON 回應。

---

## Phase 1：資料庫設計與 TypeORM（8/1 - 8/3，約 3 天）

**學習目標**：理解資料表關聯（1對多、多對多）、Entity 定義、migration 概念。

- [x] 安裝 typeorm、pg、reflect-metadata，設定 DataSource 連線
- [x] 依 PRD 第十三節建立四個 Entity：`User`、`Category`、`SkillItem`、`Favorite`
- [x] 想清楚關聯再動手：
  - Category ↔ SkillItem 是什麼關係？
  - Favorite 為什麼是 User 和 SkillItem 的「中間表」？主鍵怎麼設計才能防止重複收藏（PRD 邊界情境）？
- [ ] 建立 seed script：塞入 1 個 admin、1 個 member 測試帳號（密碼要先過 bcrypt）、2-3 個類別、5-10 筆範例 Prompt/Skill
- [ ] 用 TypeORM 的 synchronize 或 migration 把資料表建出來（先搞懂兩者差別與風險）

**引導問題**
- `synchronize: true` 為什麼不能用在正式環境？
- `tags` 是字串陣列，在 PostgreSQL 有哪些存法？各有什麼取捨？（simple-array / jsonb / 獨立資料表）

**驗收**：跑完 seed 後，用 psql 或 GUI 工具（如 DBeaver）能看到四張表和測試資料。

---

## Phase 2：登入與角色權限（8/4 - 8/8，約 5 天）⚠️ 本專案最核心的學習區

**學習目標**：JWT 的簽發與驗證、Express middleware 機制、角色權限檢查。這是 PRD 評分佔比最重的區塊之一（20 分）。

- [ ] `POST /auth/login`：驗證 email + 密碼（bcrypt.compare），成功回傳 JWT（PRD FR-02）
- [ ] JWT payload 要放什麼？（想想：為什麼放 userId 和 role，但不放密碼或敏感資料？）
- [ ] 寫 `authMiddleware`：從 `Authorization: Bearer <token>` 取出並驗證 token，把使用者資訊掛到 request 上
- [ ] 寫 `requireRole('admin')` middleware：檢查角色，不足回 403（PRD FR-04）
- [ ] `GET /auth/me`：回傳目前登入者資訊
- [ ] `POST /auth/logout`：想清楚 —— JWT 是無狀態的，後端「登出」實際能做什麼？前端該做什麼？（這題答案值得寫進發表的「自己的判斷」）
- [ ] 錯誤處理對齊 PRD 第十四節：401 帳密錯誤（不透露帳號是否存在）、401 未登入、403 權限不足

**引導問題**
- middleware 的 `next()` 是做什麼的？middleware 掛的順序為什麼重要？
- JWT 過期時間設多久合理？過期後使用者體驗是什麼？
- 如果只在前端藏按鈕、後端不擋，會發生什麼事？（PRD 技術限制明確要求後端也要擋）

**驗收**：用 REST client（Postman / Thunder Client / REST Client 外掛）測通：
1. 錯誤帳密 → 401；2. member 登入拿到 token；3. 帶 token 打 `/auth/me` 成功；4. member 的 token 打 admin API → 403。

---

## Phase 3：後台管理 API（8/9 - 8/11，約 3 天）

**學習目標**：RESTful CRUD 設計、輸入驗證、Router 分層組織。

- [ ] `POST /admin/categories` 新增類別（FR-05），名稱空白回 400
- [ ] `PATCH /admin/categories/:id`、`DELETE /admin/categories/:id`
- [ ] 刪除類別的邊界情境：底下還有資料時要阻擋（PRD 第十五節）
- [ ] `POST /admin/skills` 新增 Prompt/Skill（FR-07），標題/內容空白回 400
- [ ] `PATCH /admin/skills/:id`、`DELETE /admin/skills/:id`（FR-14）
- [ ] 所有 `/admin/*` 路由都掛上 `requireRole('admin')`
- [ ] 找不到資料回 404、統一的錯誤處理 middleware（500 兜底）

**引導問題**
- 驗證邏輯寫在 route handler 裡好，還是抽成獨立層？程式碼開始重複時你會怎麼整理？
- Express 的錯誤處理 middleware 和一般 middleware 簽名差在哪？

**驗收**：REST client 測通全部後台 API，含錯誤情境（空白欄位、不存在的 id、member 權限打入被擋）。

---

## Phase 4：前台 API（8/12 - 8/14，約 3 天）

**學習目標**：查詢參數處理、TypeORM 查詢（where / like / relations）、多對多操作。

- [ ] `GET /categories` 類別列表（FR-06）
- [ ] `GET /skills` 列表，支援 `keyword`（比對標題/內容/標籤，FR-10）與 `categoryId` 篩選（FR-11）
- [ ] `GET /skills/:id` 詳情（FR-09），不存在回 404
- [ ] `POST /favorites/:skillId` 收藏（FR-12），重複收藏回 409
- [ ] `DELETE /favorites/:skillId` 取消收藏
- [ ] `GET /me/favorites` 我的收藏（FR-13）
- [ ] 搜尋沒結果回空陣列（是正常狀態，不是錯誤）

**引導問題**
- keyword 搜尋用 TypeORM 怎麼寫「標題 或 內容 或 標籤 包含」？`ILike` 和 `Like` 差在哪？
- 防重複收藏靠「先查再寫」還是靠資料庫唯一約束？哪個更可靠？為什麼？

**驗收**：REST client 走完 PRD 的完整主流程（admin 建資料 → member 搜尋 → 收藏 → 查看收藏），全部通。**到這裡後端 MVP 就完成了。**

---

## Phase 5：Vue 前端（8/15 - 8/18，約 4 天）

**學習目標**：（你的舒適區，重點是前後端整合）CORS、token 的存放與夾帶、router guard。

- [ ] `web/`：建立 Vue 3 專案（Vite），裝 vue-router、pinia、axios（或 fetch 封裝）
- [ ] 後端加 `cors` 設定，理解為什麼瀏覽器需要它而 Postman 不用
- [ ] 登入頁：呼叫 `/auth/login`，token 存放策略自己決定並能說出取捨（localStorage vs cookie）
- [ ] axios interceptor：自動夾帶 token、401 時導回登入頁
- [ ] 前台頁面：列表（含搜尋框 + 類別篩選）、詳情頁、我的收藏頁
- [ ] 收藏按鈕狀態要清楚（已收藏/未收藏，PRD 產品用心點）
- [ ] 後台頁面：類別管理、Prompt/Skill 管理（表單 + 列表 + 編輯/刪除）
- [ ] Router guard：未登入導去登入頁；member 進 `/admin` 導回前台（但記住：真正的防線在後端）
- [ ] 空狀態：搜尋無結果、收藏清單為空的友善提示（PRD 第十五節）
- [ ] 加分：詳情頁「一鍵複製」按鈕（FR-15，成本低效果好）

**驗收**：瀏覽器完整走一遍 Demo 流程：admin 登入 → 新增類別 → 新增資料 → 登出 → member 登入 → 搜尋/篩選 → 收藏 → 我的收藏。

---

## Phase 6：打磨與發表準備（8/19 - 8/21，約 3 天）

- [ ] 對照 PRD 第二十六節驗收清單逐項打勾
- [ ] README：安裝步驟、環境變數說明（`.env.example`）、DB 建立與 seed 指令、測試帳號、前後台操作流程
- [ ] 錯誤訊息總檢查：對照 PRD 第十四節的狀態碼與文案
- [ ] AI 協作紀錄：整理這段時間的紀錄成 README 小節（PRD 第二十四節有範例格式）
- [ ] 準備發表內容：照 PRD 第二十三節的 11 點順序寫大綱，特別準備「哪些是 AI 建議但我自己做了判斷」的具體例子
- [ ] Demo 彩排：計時走一遍主流程，確認 seed 資料讓畫面好看
- [ ] （行有餘力）加分項：tag 篩選、最近使用、部署

---

## 風險備忘（對照 PRD 第二十一節）

| 風險 | 對策 |
|---|---|
| TypeORM + PostgreSQL 設定卡關超過 1 天 | 降級方案：先用 JSON 檔案版 repository 跑通主流程，DB 之後再接回來（介面先抽好） |
| Phase 2 JWT 卡太久 | 這是核心學習區，可以多吃 1-2 天，從 Phase 5 的前端時間補（那是你的強項） |
| 想把後台做到完整 | MVP 先求「新增」能動，編輯/刪除是 Should 級 |
| 時間不夠 | 砍加分項順序：部署 → 最近使用 → tag 篩選；一鍵複製便宜留著 |
