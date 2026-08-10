# Categories 契約

> 全域約定（envelope、錯誤格式、分頁 G-04）見 [api-spec.md](../api-spec.md) 第一節，本檔不重複。
> 共通錯誤（401 `UNAUTHENTICATED`、403 `FORBIDDEN`、500 `INTERNAL_ERROR`）依錯誤碼表，各端點只列**特有**的錯誤。
> admin 端點（`/admin/categories/*`）與前台查詢操作**同一個資源**，所以契約放同一份檔案——admin 只是「誰能打」的屬性，不是獨立模組。

## `GET /categories`　🚧 待填

**權限**：已登入
**用途**：類別列表（PRD FR-06）

> 💭 **先想清楚**：G-04 說分頁適用本端點，但類別的主要用途是**篩選下拉選單**——下拉選單需要「全部類別」，分頁反而礙事。
> 類別數量少（seed 大概 3～5 個），你要：a) 照 G-04 分頁；b) 本端點例外不分頁、回全量？
> 選 b 的話要回 api-spec.md G-04 註記例外。

**Query 參數**：❓ 依上面的決定（分頁參數 or 無）

**Response 200**

```jsonc
{
  "status": "success",
  "message": "查詢成功",
  "data": [
    { "id": 1, "name": "開發工具" }
    // ❓ 待填：要不要帶 skillCount（該類別下有幾筆）？前端列表頁顯示用
  ]
  // ❓ 若照 G-04 分頁，這裡要有 pagination 物件
}
```

**錯誤回應**：無特有錯誤

---

## `POST /admin/categories`　🚧 待填

**權限**：admin
**用途**：新增類別（PRD FR-05）

**Request Body**

| 欄位 | 型別 | 必填 | 驗證規則 |
|---|---|:---:|---|
| `name` | string | ✅ | 不可空白（trim 後）；❓ 長度上限？（對照 data-model.md 的欄位定義） |

**Response 201**

```jsonc
{
  "status": "success",
  "message": "建立成功",
  "data": { "id": 3, "name": "開發工具" }
}
```

**錯誤回應**

| 狀態碼 | 情境 | `code` | `message` |
|---:|---|---|---|
| 400 | 名稱空白 | `VALIDATION_ERROR` | 請輸入類別名稱（`errors: [{ field: "name", ... }]`） |
| ❓ | 名稱重複要擋嗎？ | ❓ | ❓（若擋：409；不擋要說得出理由） |

---

## `PATCH /admin/categories/:id`　🚧 待填

**權限**：admin
**用途**：編輯類別

**Path 參數**：`id` — 正整數

**Request Body**：同 POST（❓ PATCH 語意下 `name` 是否仍必填？只有一個欄位的話其實沒差，寫下你的認定）

**Response 200**：❓ 待填（建議回更新後的完整物件，前端不用再查一次）

**錯誤回應**

| 狀態碼 | 情境 | `code` | `message` |
|---:|---|---|---|
| 400 | 名稱空白 | `VALIDATION_ERROR` | 請輸入類別名稱 |
| 404 | id 不存在 | `NOT_FOUND` | 找不到指定資料 |

---

## `DELETE /admin/categories/:id`　🚧 待填

**權限**：admin
**用途**：刪除類別

> 💭 **本檔最值得想的一題**：類別底下還有 Skill 時可以刪嗎？（對照 data-model.md 的 FK 設計）
> - a) 擋下來回錯誤（那要新增一個錯誤碼？409？）
> - b) 連帶刪除底下的 Skill（CASCADE——使用者知道後果嗎？）
> - c) Skill 的 categoryId 設為 NULL（那前端「未分類」怎麼顯示？）
> 你的資料庫 FK 設定必須和這裡的決定一致，兩邊對不上就是上線後的 500。

**Path 參數**：`id` — 正整數

**Response**：❓ 200 帶 message 還是 204 No Content？（204 依 HTTP 語意不能有 body，和 G-01「固定帶 message」衝突——建議 200，理由寫下來）

**錯誤回應**

| 狀態碼 | 情境 | `code` | `message` |
|---:|---|---|---|
| 404 | id 不存在 | `NOT_FOUND` | 找不到指定資料 |
| ❓ | 底下還有 Skill（若選方案 a） | ❓ | ❓ |
