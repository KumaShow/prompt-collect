# API 契約 — Prompt / Skill 收藏庫

> 狀態：**全域約定已定案（2026-08-10）** — 各端點契約撰寫中
> 依據：[PRD.md](../PRD.md) 第十二、十四節
> 流程參考：[backend-workflow.md](../backend-workflow.md) Step 4
> 建立：2026-08-03

**使用方式**：契約定稿後，前後端就能平行開工——你自己就是前端，所以這份文件是「今天的你」寫給「下週的你」的規格書。
Phase 5 寫 Vue 的時候，你會非常感謝現在把 response 形狀寫清楚的自己。

---

## 一、全域約定（✅ 2026-08-10 全數定案）

這些是**全站一致性**的決定。一旦寫了三支 API 才想改，就要回頭改全部。

### G-01 回應是否包信封（envelope）

```jsonc
// 方案 A：直接回資料
{ "id": 1, "title": "Code Review Prompt" }

// 方案 B：包一層
{ "status": "success", "data": { "id": 1, "title": "Code Review Prompt" } }

// 方案 C：包一層並固定帶 message
{ "status": "success", "message": "建立成功", "data": { ... } }
```

**引導問題**
- 你在 Phase 5 會寫 axios interceptor。哪個方案讓 interceptor 的拆解邏輯最單純？
- 列表回應需要帶分頁資訊（總筆數、目前頁數）。方案 A 要把它放哪裡？（提示：`data` 是陣列的話，`total` 沒地方放，除非改用 header 或另包一層）
- 前端拿到成功回應時，需要後端給的 `message` 嗎？還是前端自己決定顯示什麼比較好？（提示：多語系）

**我的決定**（✅ 2026-08-10）：方案 C——**所有**成功回應固定帶 `message`（GET 也帶，如「查詢成功」）。

**理由**：因為可能需要分頁資訊，統一放 `pagination` 物件（形狀見 G-04）；若需多語系則暫時由前端管理，message 只給「建立成功」這種簡單訊息即可。固定帶 message 讓所有成功回應形狀一致，前端 interceptor 不用分辨「有沒有 message」兩種情況。

---

### G-02 錯誤回應格式

```jsonc
{
  "status": "error",
  "code": "VALIDATION_ERROR",   // 機器可讀的錯誤碼（字串，非 HTTP 數字），見第二節對照表
  "message": "輸入資料有誤",     // 給人看的訊息
  "errors": [                   // 選填：只有 400 驗證錯誤帶，逐欄位明細
    { "field": "title", "message": "請輸入標題" },
    { "field": "content", "message": "請輸入內容" }
  ]
}
```

**引導問題**
- 為什麼前端不該用 `if (message === '已經收藏過此項目')` 來判斷錯誤？（提示：文案會改、多語系）
- 400 驗證錯誤時，如果有多個欄位不合法，要一次全部回傳還是只回第一個？前端哪一種比較好用？（提示：表單各欄位下方要顯示各自的錯誤）
- 500 的錯誤訊息可以直接把 stack trace 回給前端嗎？為什麼不行？

**我的決定**（✅ 2026-08-10）：欄位名用 **`code`**；400 驗證錯誤統一回 `VALIDATION_ERROR`，多欄位不合法時用 `errors` 陣列一次帶回全部欄位明細。

**理由**：`message` 可能多語系化，前端不應依賴文字判斷錯誤；`code` 提供機器可讀的錯誤類型（不用 `statusCode` 這個名字——它在 HTTP 語境專指 400、401 這種數字狀態碼，放字串錯誤碼容易誤讀）。`errors` 明細讓表單能一次在各欄位下方顯示對應錯誤，zod 的 issues 可直接映射過來。

---

### G-03 命名慣例

| 項目 | 選項 | 決定 |
|---|---|---|
| JSON 欄位命名 | `camelCase` / `snake_case` | camelCase |
| 資料庫欄位命名 | `camelCase` / `snake_case` | snake_case |
| 兩者不同時誰負責轉換 | ORM 的 naming strategy / 手動 mapping | ORM 的 naming strategy |

> PostgreSQL 慣例是 `snake_case`，JavaScript 慣例是 `camelCase`。你要在哪一層處理這個落差？

---

### G-04 列表端點的通用參數（✅ 2026-08-03：決定做完整分頁，前後端都做）

依 [data-model.md](./data-model.md) 假設 A-01。適用於 `GET /skills`、`GET /categories`、`GET /me/favorites`。

| 參數 | 用途 | 預設值 | 決定（✅ 2026-08-10） |
|---|---|---|---|
| `page` | 第幾頁 | **1** | 從 1 開始（和使用者看到的頁碼一致，少一次 off-by-one） |
| `limit` | 每頁筆數 | **10** | 上限 **100**：`z.coerce.number().int().min(1).max(100).default(10)` |
| `sort` | 排序欄位與方向 | `createdAt DESC`（A-03） | **不開放**前端指定，固定新→舊；未來要開放再加參數，不破壞相容 |

> `limit` 預設 10 是刻意搭配 seed 的 12 筆——剛好 2 頁，分頁功能 demo 得出來又不用塞大量假資料。前端只做「上一頁 / 下一頁 + 第 X / Y 頁」精簡版。詳見 [data-model.md](./data-model.md) 的「分頁的 demo 算術」。

**引導問題**
- 如果不設 `limit` 上限，有人打 `?limit=999999` 會發生什麼事？（提示：資料庫要撈全表、序列化成 JSON、佔滿記憶體——這是一種阻斷服務的手法）
- zod 可以直接處理這件事嗎？（提示：`z.coerce.number().int().min(1).max(100).default(20)`）
- `page=0` 或 `page=-1` 送進 `OFFSET` 會發生什麼？

**分頁 response 形狀（✅ 2026-08-10 定稿）**

```jsonc
{
  "status": "success",
  "message": "查詢成功",
  "data": [ /* ... */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 12,        // 總筆數
    "totalPages": 2     // 後端算好
  }
}
```

**引導問題**：`totalPages` 讓後端算好 vs 前端用 `Math.ceil(total / limit)` 自己算——哪個好？（提示：想想「同一份邏輯有兩個實作」會發生什麼事）

**決定**：容器命名 `pagination`（與 G-01 理由一致，語意比通用的 `meta` 直白）；`totalPages` 由後端用同一份 `limit` 算好，前端不重複實作 `Math.ceil`，避免兩份邏輯漂移。

> ⚠️ **實作提醒**：分頁要用 TypeORM 的 `findAndCount()` 而不是 `find()`——它會同時回傳「這一頁的資料」和「符合條件的總筆數」。若用 `find()` 再另外 `count()`，兩次查詢之間資料可能變動，總數會對不上。
>
> ⚠️ **Demo 提醒**：seed **12 筆**（PRD 建議 5-10 筆，只需稍微多一點）搭配 `limit` 預設 10 → 剛好 2 頁，分頁翻得動。品質重於數量：12 筆真實可用的 Prompt 比 30 筆 `測試資料 N` 有價值。

---

### G-05 認證方式

已由 TODO.md 決定用 JWT。剩下的細節：

| 項目 | 決定（✅ 2026-08-10） |
|---|---|
| token 放哪裡傳輸 | `Authorization: Bearer <token>` |
| access token 有效期 | **1 小時**（`.env` 的 `JWT_ACCESS_EXPIRES_IN` 需從 `15m` 改為 `1h`，`.env.example` 同步） |
| 要不要實作 refresh token 流程 | **不做**（PRD 沒要求、工期不足；列為未來優化） |
| 前端 token 存哪裡 | localStorage（接受 XSS 取捨，發表時要能說明） |

**引導問題**
- `env.ts` 已經準備了 `JWT_REFRESH_SECRET`。refresh token 流程要多寫一支 API 和前端的自動續期邏輯。**在只剩 18 天、PRD 沒要求的情況下，值得做嗎？** 如果不做，access token 的 `15m` 會造成什麼體驗？該調整嗎？
- localStorage 存 token 的風險是什麼？（提示：XSS）httpOnly cookie 的風險又是什麼？（提示：CSRF）為什麼「兩者都有風險」不代表「兩者一樣」？
- 這一題的答案很適合寫進發表的「自己的判斷」。

**我的決定**：
 - access token 使用 `Authorization: Bearer <token>` 放 localStorage（不用關閉瀏覽器都要重新登入），因開發時間不夠，暫時先用 localStorage。（未來可研究改為 Access Token + Refresh Token）
 - access token 有效期 1 hr（PRD 預設 15 分鐘太短，會造成前端頻繁跳回登入頁的糟糕體驗）
---

## 二、錯誤碼對照表

PRD 第十四節已給定狀態碼與訊息，錯誤碼命名 ✅ 2026-08-10 定案。

| 情境 | 狀態碼 | PRD 指定訊息 | `code` |
|---|---:|---|---|
| 登入失敗 | 401 | 帳號或密碼錯誤 | `INVALID_CREDENTIALS` |
| 未登入 | 401 | 請先登入 | `UNAUTHENTICATED` |
| 權限不足 | 403 | 你沒有權限執行此操作 | `FORBIDDEN` |
| 類別名稱空白 | 400 | 請輸入類別名稱 | `VALIDATION_ERROR`＋`errors: [{ field: "name", ... }]` |
| Prompt / Skill 標題空白 | 400 | 請輸入標題 | `VALIDATION_ERROR`＋`errors: [{ field: "title", ... }]` |
| Prompt / Skill 內容空白 | 400 | 請輸入內容 | `VALIDATION_ERROR`＋`errors: [{ field: "content", ... }]` |
| 找不到資料 | 404 | 找不到指定資料 | `NOT_FOUND` |
| 重複收藏 | 409 | 已經收藏過此項目 | `ALREADY_FAVORITED` |
| 系統錯誤 | 500 | 系統發生錯誤，請稍後再試 | `INTERNAL_ERROR` |

**注意「登入失敗」與「未登入」都是 401 但語意不同** —— 這正是需要 `code` 的理由：前端要能區分「帳密打錯，留在登入頁顯示錯誤」和「token 過期，導回登入頁」。

**引導問題**
- 三個 400 都是「欄位空白」。它們需要三個不同的 `code`，還是一個 `VALIDATION_ERROR` 加上欄位資訊就夠？哪種前端比較好處理？

**決定**（✅ 2026-08-10）：三個 400 共用 `VALIDATION_ERROR`，欄位資訊放 `errors` 明細陣列（見 G-02）——前端表單依 `field` 對應顯示，不用維護一大串 code 的 switch。

---

## 三、端點清單

權限欄位：`公開` / `已登入` / `member` / `admin`

### Auth

| Method | Path | 權限 | 說明 | 契約狀態 |
|---|---|---|---|---|
| `GET` | `/health` | 公開 | 服務狀態（FR-01） | ✅ 已實作 |
| `POST` | `/auth/login` | 公開 | 登入（FR-02） | ✅ [auth.md](./contracts/auth.md) |
| `POST` | `/auth/logout` | 已登入 | 登出（FR-03） | ✅ [auth.md](./contracts/auth.md) |
| `GET` | `/auth/me` | 已登入 | 目前登入者 | ✅ [auth.md](./contracts/auth.md) |

### 前台

| Method | Path | 權限 | 說明 | 契約狀態 |
|---|---|---|---|---|
| `GET` | `/categories` | 已登入 | 類別列表（FR-06） | 🚧 [categories.md](./contracts/categories.md) |
| `GET` | `/skills` | 已登入 | 列表 + `keyword` + `categoryId` + 分頁（FR-08/10/11） | 🚧 [skills.md](./contracts/skills.md) |
| `GET` | `/skills/:id` | 已登入 | 詳情（FR-09） | 🚧 [skills.md](./contracts/skills.md) |
| `POST` | `/favorites/:skillId` | **已登入** | 收藏（FR-12） | 🚧 [favorites.md](./contracts/favorites.md) |
| `DELETE` | `/favorites/:skillId` | **已登入** | 取消收藏 | 🚧 [favorites.md](./contracts/favorites.md) |
| `GET` | `/me/favorites` | **已登入** | 我的收藏（FR-13） | 🚧 [favorites.md](./contracts/favorites.md) |

> **權限標註變更紀錄（2026-08-03）**：PRD 第十二節把收藏相關 API 標為 `member`，本專案改標 **`已登入`**——依 [data-model.md](./data-model.md) 假設 A-02「管理者也可以收藏」。
> 實作上只掛 `authMiddleware`，**不掛** `requireRole('member')`。這是刻意偏離 PRD 的決定，發表時要能說明理由。

### 後台

| Method | Path | 權限 | 說明 | 契約狀態 |
|---|---|---|---|---|
| `POST` | `/admin/categories` | admin | 新增類別（FR-05） | 🚧 [categories.md](./contracts/categories.md) |
| `PATCH` | `/admin/categories/:id` | admin | 編輯類別 | 🚧 [categories.md](./contracts/categories.md) |
| `DELETE` | `/admin/categories/:id` | admin | 刪除類別 | 🚧 [categories.md](./contracts/categories.md) |
| `POST` | `/admin/skills` | admin | 新增（FR-07） | 🚧 [skills.md](./contracts/skills.md) |
| `PATCH` | `/admin/skills/:id` | admin | 編輯（FR-14） | 🚧 [skills.md](./contracts/skills.md) |
| `DELETE` | `/admin/skills/:id` | admin | 刪除（FR-14） | 🚧 [skills.md](./contracts/skills.md) |

**引導問題**
1. `POST /favorites/:skillId` 的權限標成 `member`。**管理者打這支 API 應該成功還是 403？**（對照 data-model.md 的 A-02）
2. `GET /skills` 標成「已登入」。未登入的訪客能看列表嗎？PRD 第六節說訪客「可以看首頁或登入頁」——那首頁上有資料嗎？
3. 收藏用 `POST /favorites/:skillId` 而不是 `POST /skills/:id/favorite`。兩種設計哪個更 RESTful？PRD 選了前者，你要照著做還是改？（照 PRD 比較安全，但你要能說出差別）
4. **`GET /skills` 的回應要不要帶「這筆我收藏了沒」？** 如果不帶，前端要怎麼在列表上正確顯示收藏按鈕的狀態（PRD 產品用心點明確要求「收藏按鈕狀態清楚」）？
   - 方案一：列表回應每筆帶 `isFavorited: boolean`
   - 方案二：前端另外打一次 `/me/favorites`，自己在前端比對
   兩種各有什麼取捨？（提示：請求次數 vs 後端查詢複雜度；以及資料不同步的可能）
   **這題是本專案 API 設計最值得想的一題，因為 PRD 沒寫，但沒它前端做不出好體驗。**

---

## 四、契約撰寫格式與進度

各端點契約已按**資源模組**拆檔至 [contracts/](./contracts/)（admin 端點與前台查詢操作同一資源，放同一份檔案）。完整範例見 [contracts/auth.md](./contracts/auth.md) 的 `POST /auth/login`（✅ 已定稿），其餘端點骨架已建好，照同格式補完 `❓ 待填` 即可。

每份契約至少包含：

- **權限** 與 **用途**（FR 對照）
- **Request**：Body / Query / Path 參數表 + 驗證規則
- **Response**：jsonc 範例，依 G-01 envelope（固定帶 `status` / `message` / `data`）
- **錯誤回應**：只列該端點**特有**的錯誤；共通 401 / 403 / 500 依第二節錯誤碼表，不重複抄寫
- **實作注意事項**（有才寫）

### 待補完的契約

骨架已建立（2026-08-10）。請在實作各 Phase **前**補完 `❓ 待填`，寫完把該端點的 🚧 改 ✅（本表與第三節端點清單同步更新）：

**[contracts/auth.md](./contracts/auth.md)**（Phase 2 前）
- [x] `POST /auth/login`
- [x] `POST /auth/logout`（✅ 2026-08-12 定稿：最簡方案，決策理由見契約）
- [x] `GET /auth/me`（✅ 2026-08-12 定稿：使用者已刪除回 401）

**[contracts/categories.md](./contracts/categories.md)**（admin 部分 Phase 3 前、`GET /categories` Phase 4 前）
- [ ] `GET /categories` ← 先決定要不要照 G-04 分頁（下拉選單情境）
- [ ] `POST /admin/categories`
- [ ] `PATCH /admin/categories/:id`
- [ ] `DELETE /admin/categories/:id` ← 有子資料時的錯誤回應

**[contracts/skills.md](./contracts/skills.md)**（admin 部分 Phase 3 前、前台 Phase 4 前）
- [ ] `GET /skills` ← 含 `isFavorited` 那一題（第三節引導問題 4）
- [ ] `GET /skills/:id`
- [ ] `POST /admin/skills`
- [ ] `PATCH /admin/skills/:id`
- [ ] `DELETE /admin/skills/:id`

**[contracts/favorites.md](./contracts/favorites.md)**（Phase 4 前）
- [ ] `POST /favorites/:skillId`
- [ ] `DELETE /favorites/:skillId` ← 取消「沒收藏過的」回 404 還是冪等成功
- [ ] `GET /me/favorites`

---

## 五、驗證方式

建議建立 `apps/api/requests/*.http`（VS Code REST Client 外掛），依 Phase 分檔：

```txt
apps/api/requests/
├── auth.http        Phase 2
├── admin.http       Phase 3
└── public.http      Phase 4
```

**好處**：這些檔案可以進 git，同時是測試腳本和 API 使用範例，README 可以直接指向它們。

每支 API 至少驗證四種情境（詳見 [backend-workflow.md](../backend-workflow.md) Step 8）：
1. 正常路徑 → 2xx
2. 格式錯誤 → 400
3. 未帶 token → 401；帶錯角色 token → 403
4. 邊界情境 → 404 / 409
