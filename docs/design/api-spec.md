# API 契約 — Prompt / Skill 收藏庫

> 狀態：**草稿（設計中）** — `❓ 待決定` 需自行填寫
> 依據：[PRD.md](../PRD.md) 第十二、十四節
> 流程參考：[backend-workflow.md](../backend-workflow.md) Step 4
> 建立：2026-08-03

**使用方式**：契約定稿後，前後端就能平行開工——你自己就是前端，所以這份文件是「今天的你」寫給「下週的你」的規格書。
Phase 5 寫 Vue 的時候，你會非常感謝現在把 response 形狀寫清楚的自己。

---

## 一、全域約定（待決策）

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

**我的決定**：
**理由**：

---

### G-02 錯誤回應格式

```jsonc
{
  "status": "error",
  "code": "❓",        // 機器可讀的錯誤碼
  "message": "❓"      // 給人看的訊息
}
```

**引導問題**
- 為什麼前端不該用 `if (message === '已經收藏過此項目')` 來判斷錯誤？（提示：文案會改、多語系）
- 400 驗證錯誤時，如果有多個欄位不合法，要一次全部回傳還是只回第一個？前端哪一種比較好用？（提示：表單各欄位下方要顯示各自的錯誤）
- 500 的錯誤訊息可以直接把 stack trace 回給前端嗎？為什麼不行？

**我的決定**：
**理由**：

---

### G-03 命名慣例

| 項目 | 選項 | 決定 |
|---|---|---|
| JSON 欄位命名 | `camelCase` / `snake_case` | ❓ |
| 資料庫欄位命名 | `camelCase` / `snake_case` | ❓ |
| 兩者不同時誰負責轉換 | ORM 的 naming strategy / 手動 mapping | ❓ |

> PostgreSQL 慣例是 `snake_case`，JavaScript 慣例是 `camelCase`。你要在哪一層處理這個落差？

---

### G-04 列表端點的通用參數

| 參數 | 用途 | 預設值 | 決定 |
|---|---|---|---|
| `page` | 第幾頁（從 1 或 0 開始？） | ❓ | ❓ |
| `limit` | 每頁筆數（上限要不要設？） | ❓ | ❓ |
| `sort` | 排序欄位與方向 | ❓ | ❓ |

**引導問題**
- 如果不設 `limit` 上限，有人打 `?limit=999999` 會發生什麼事？
- 分頁資訊要回傳哪些欄位才夠前端畫分頁元件？（`total`？`totalPages`？`hasNext`？）
- PRD 沒要求分頁。**現在做 vs 之後做**的成本差多少？（提示：現在做只是多兩個參數；之後做要改 response 形狀，前端全部連帶改）

---

### G-05 認證方式

已由 TODO.md 決定用 JWT。剩下的細節：

| 項目 | 決定 |
|---|---|
| token 放哪裡傳輸 | `Authorization: Bearer <token>` / cookie |
| access token 有效期 | `.env` 目前預設 `15m` |
| 要不要實作 refresh token 流程 | ❓（`.env` 已備妥 secret，但 PRD 沒要求） |
| 前端 token 存哪裡 | ❓ localStorage / sessionStorage / httpOnly cookie |

**引導問題**
- `env.ts` 已經準備了 `JWT_REFRESH_SECRET`。refresh token 流程要多寫一支 API 和前端的自動續期邏輯。**在只剩 18 天、PRD 沒要求的情況下，值得做嗎？** 如果不做，access token 的 `15m` 會造成什麼體驗？該調整嗎？
- localStorage 存 token 的風險是什麼？（提示：XSS）httpOnly cookie 的風險又是什麼？（提示：CSRF）為什麼「兩者都有風險」不代表「兩者一樣」？
- 這一題的答案很適合寫進發表的「自己的判斷」。

---

## 二、錯誤碼對照表

PRD 第十四節已給定狀態碼與訊息，錯誤碼（`code`）欄位待你命名。

| 情境 | 狀態碼 | PRD 指定訊息 | `code`（待填） |
|---|---:|---|---|
| 登入失敗 | 401 | 帳號或密碼錯誤 | ❓ |
| 未登入 | 401 | 請先登入 | ❓ |
| 權限不足 | 403 | 你沒有權限執行此操作 | ❓ |
| 類別名稱空白 | 400 | 請輸入類別名稱 | ❓ |
| Prompt / Skill 標題空白 | 400 | 請輸入標題 | ❓ |
| Prompt / Skill 內容空白 | 400 | 請輸入內容 | ❓ |
| 找不到資料 | 404 | 找不到指定資料 | ❓ |
| 重複收藏 | 409 | 已經收藏過此項目 | ❓ |
| 系統錯誤 | 500 | 系統發生錯誤，請稍後再試 | ❓ |

**注意「登入失敗」與「未登入」都是 401 但語意不同** —— 這正是需要 `code` 的理由：前端要能區分「帳密打錯，留在登入頁顯示錯誤」和「token 過期，導回登入頁」。

**引導問題**
- 三個 400 都是「欄位空白」。它們需要三個不同的 `code`，還是一個 `VALIDATION_ERROR` 加上欄位資訊就夠？哪種前端比較好處理？

---

## 三、端點清單

權限欄位：`公開` / `已登入` / `member` / `admin`

### Auth

| Method | Path | 權限 | 說明 | 契約狀態 |
|---|---|---|---|---|
| `GET` | `/health` | 公開 | 服務狀態（FR-01） | ✅ 已實作 |
| `POST` | `/auth/login` | 公開 | 登入（FR-02） | 📝 見下方範例 |
| `POST` | `/auth/logout` | 已登入 | 登出（FR-03） | ❓ |
| `GET` | `/auth/me` | 已登入 | 目前登入者 | ❓ |

### 前台

| Method | Path | 權限 | 說明 | 契約狀態 |
|---|---|---|---|---|
| `GET` | `/categories` | 已登入 | 類別列表（FR-06） | ❓ |
| `GET` | `/skills` | 已登入 | 列表 + `keyword` + `categoryId`（FR-08/10/11） | ❓ |
| `GET` | `/skills/:id` | 已登入 | 詳情（FR-09） | ❓ |
| `POST` | `/favorites/:skillId` | member | 收藏（FR-12） | ❓ |
| `DELETE` | `/favorites/:skillId` | member | 取消收藏 | ❓ |
| `GET` | `/me/favorites` | member | 我的收藏（FR-13） | ❓ |

### 後台

| Method | Path | 權限 | 說明 | 契約狀態 |
|---|---|---|---|---|
| `POST` | `/admin/categories` | admin | 新增類別（FR-05） | ❓ |
| `PATCH` | `/admin/categories/:id` | admin | 編輯類別 | ❓ |
| `DELETE` | `/admin/categories/:id` | admin | 刪除類別 | ❓ |
| `POST` | `/admin/skills` | admin | 新增（FR-07） | ❓ |
| `PATCH` | `/admin/skills/:id` | admin | 編輯（FR-14） | ❓ |
| `DELETE` | `/admin/skills/:id` | admin | 刪除（FR-14） | ❓ |

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

## 四、契約撰寫範例

下面用 `POST /auth/login` 示範**一份完整契約該長什麼樣**。其餘端點請照這個格式自己補完。

### `POST /auth/login`

**權限**：公開
**用途**：會員 / 管理者登入，成功回傳 JWT（PRD FR-02）

**Request Body**

| 欄位 | 型別 | 必填 | 驗證規則 |
|---|---|:---:|---|
| `email` | string | ✅ | 合法 email 格式 |
| `password` | string | ✅ | 最少 1 字元（登入時不需檢查密碼強度，那是註冊的事） |

```jsonc
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response 200**

```jsonc
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "name": "管理員",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

> ⚠️ `user` 物件的欄位是**白名單挑選**的結果，絕對不能直接 `res.json(user)`——那會把 `passwordHash` 送給前端。這是最常見的資安事故。

**錯誤回應**

| 狀態碼 | 情境 | `code` | `message` |
|---:|---|---|---|
| 400 | email 格式錯誤 / 缺欄位 | `VALIDATION_ERROR` | 請輸入正確的帳號與密碼 |
| 401 | 帳號不存在 **或** 密碼錯誤 | `INVALID_CREDENTIALS` | 帳號或密碼錯誤 |
| 500 | 未預期錯誤 | `INTERNAL_ERROR` | 系統發生錯誤，請稍後再試 |

> ⚠️ **「帳號不存在」和「密碼錯誤」必須回完全相同的狀態碼、code 和訊息**（PRD 第十五節明確要求）。
> 否則攻擊者可以用不同的回應區分出哪些 email 有註冊過，這叫**使用者列舉（user enumeration）**。
> 進階：兩種情況的**回應時間**也可能洩漏資訊——帳號不存在時如果直接 return，會比帳號存在時（要跑 bcrypt 比對）快很多。要不要處理這個時序差異，是安全性與複雜度的取捨。

**實作注意事項**
- 用 `bcrypt.compare()` 比對，不要自己雜湊後比字串
- JWT payload 放 `userId` 和 `role`，**不要放** `passwordHash` 或任何敏感資料——JWT 只是簽名，**不是加密**，任何人都能用 base64 解出 payload 內容
- 簽發時設定 `expiresIn`（`env.JWT_ACCESS_EXPIRES_IN`）

---

### 待補完的契約

以下請照上面格式自己撰寫（建議在實作各 Phase 前先寫，寫完再動手）：

- [ ] `GET /auth/me`
- [ ] `POST /auth/logout` ← 想清楚無狀態的 JWT，「登出」後端實際能做什麼
- [ ] `GET /categories`
- [ ] `GET /skills`（含 query 參數與分頁的完整定義）
- [ ] `GET /skills/:id`
- [ ] `POST /favorites/:skillId`
- [ ] `DELETE /favorites/:skillId`
- [ ] `GET /me/favorites`
- [ ] `POST /admin/categories`
- [ ] `PATCH /admin/categories/:id`
- [ ] `DELETE /admin/categories/:id` ← 有子資料時的錯誤回應
- [ ] `POST /admin/skills`
- [ ] `PATCH /admin/skills/:id`
- [ ] `DELETE /admin/skills/:id`

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
