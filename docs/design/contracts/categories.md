# Categories 契約

> 全域約定（envelope、錯誤格式、分頁 G-04）見 [api-spec.md](../api-spec.md) 第一節；本檔只記錄 Categories 的端點規則與例外。
> 共通錯誤（401 `UNAUTHENTICATED`、403 `FORBIDDEN`、500 `INTERNAL_ERROR`）依錯誤碼表，各端點只列**特有**的錯誤。
> admin 端點（`/admin/categories/*`）與前台查詢操作**同一個資源**，所以契約放同一份檔案——admin 只是「誰能打」的屬性，不是獨立模組。

## `GET /categories`

**權限**：已登入

**用途**：類別列表（PRD FR-06）

> **G-04 例外**：本端點不使用 `page`、`limit` 或 `pagination`，直接回傳全部類別。類別數量少，且前台篩選下拉選單需要完整清單；此例外已在 [api-spec.md](../api-spec.md) G-04 註記。

**Query 參數**：無

**Response 200**

```jsonc
{
  "status": "success",
  "message": "查詢成功",
  "data": [
    { "id": "550e8400-e29b-41d4-a716-446655440000", "name": "開發工具" }
  ]
}
```

`data` 每筆只包含 `id` 與 `name`，不包含 `description` 或 `skillCount`。`id` 為 UUID。

**錯誤回應**：無特有錯誤

---

## `GET /admin/categories`（本專案補充，非原始 PRD）

**權限**：admin

**用途**：後台類別管理列表。原始 PRD 只列出新增、編輯與刪除類別；本端點是為了讓後台管理介面能取得既有類別與管理資訊而補充。

**Query 參數**：無

本端點目前不使用分頁，直接回傳全部類別。外層 response 維持全域 envelope，但 `data` 依後台管理用途提供比前台列表更完整的欄位。

**Response 200**

```jsonc
{
  "status": "success",
  "message": "查詢成功",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "開發工具",
      "description": "常用的開發工具與工作流程",
      "skillCount": 12
    }
  ]
}
```

`data` 每筆包含 `id`、`name`、`description` 與 `skillCount`。`id` 為 UUID；查無資料時仍回傳 `200` 與 `data: []`，不視為錯誤。

**錯誤回應**：無特有錯誤

---

## `POST /admin/categories`

**權限**：admin

**用途**：新增類別（PRD FR-05）

**Request Body**

| 欄位 | 型別 | 必填 | 驗證規則 |
|---|---|:---:|---|
| `name` | string | ✅ | trim 後不可空白；最多 50 字元 |
| `description` | string \| null |  | 可省略；trim 後空白或 `null` 皆儲存為 `null`；最多 500 字元 |

`name` trim 後保留原始大小寫，但重複判斷採不分大小寫。資料庫唯一性必須使用等效的 trim/case-insensitive 約束支援此規則。

**Response 201**

```jsonc
{
  "status": "success",
  "message": "建立成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "開發工具",
    "description": null
  }
}
```

**錯誤回應**

| 狀態碼 | 情境 | `code` | `message` |
|---:|---|---|---|
| 400 | 名稱空白 | `VALIDATION_ERROR` | 請輸入類別名稱（`errors: [{ field: "name", ... }]`） |
| 400 | 名稱超過 50 字元 | `VALIDATION_ERROR` | 類別名稱不可超過 50 字元（`errors: [{ field: "name", ... }]`） |
| 400 | 說明超過 500 字元 | `VALIDATION_ERROR` | 類別說明不可超過 500 字元（`errors: [{ field: "description", ... }]`） |
| 409 | trim 後不分大小寫的名稱已存在 | `CATEGORY_NAME_EXISTS` | 類別名稱已存在 |

---

## `PATCH /admin/categories/:id`

**權限**：admin

**用途**：編輯類別

**Path 參數**：`id` — UUID

**Request Body**

| 欄位 | 型別 | 必填 | 驗證規則 |
|---|---|:---:|---|
| `name` | string |  | 可省略；若提供，trim 後不可空白；最多 50 字元 |
| `description` | string \| null |  | 可省略；若提供 `null` 或 trim 後空白則清除為 `null`；最多 500 字元 |

PATCH 採部分更新語意，但至少要提供 `name` 或 `description` 其中一個欄位。省略欄位代表維持原值；`name` trim 後保留原始大小寫，但重複判斷採不分大小寫。

**Response 200**

```jsonc
{
  "status": "success",
  "message": "更新成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "開發工具",
    "description": "常用的開發工具與工作流程"
  }
}
```

**錯誤回應**

| 狀態碼 | 情境 | `code` | `message` |
|---:|---|---|---|
| 400 | `id` 不是合法 UUID | `VALIDATION_ERROR` | 類別 ID 格式錯誤 |
| 400 | 沒有提供任何可更新欄位 | `VALIDATION_ERROR` | 至少提供 name 或 description 其中一個 |
| 400 | 名稱空白 | `VALIDATION_ERROR` | 請輸入類別名稱（`errors: [{ field: "name", ... }]`） |
| 400 | 名稱超過 50 字元 | `VALIDATION_ERROR` | 類別名稱不可超過 50 字元（`errors: [{ field: "name", ... }]`） |
| 400 | 說明超過 500 字元 | `VALIDATION_ERROR` | 類別說明不可超過 500 字元（`errors: [{ field: "description", ... }]`） |
| 404 | UUID 不存在 | `NOT_FOUND` | 找不到指定資料 |
| 409 | trim 後不分大小寫的名稱已存在於其他類別 | `CATEGORY_NAME_EXISTS` | 類別名稱已存在 |

---

## `DELETE /admin/categories/:id`

**權限**：admin

**用途**：永久刪除類別

**Path 參數**：`id` — UUID

本端點採硬刪除。類別底下仍有 Skill 時不得刪除，service 層應先檢查並回傳明確錯誤；資料庫 FK 同時使用 `ON DELETE RESTRICT` 作為最後防線。不得使用 CASCADE，也不得將 `categoryId` 設為 NULL。

**Response 204**

無 response body。這是 G-01 固定 envelope/message 規則的明確例外；成功時不回傳 `status`、`message` 或 `data`。

**錯誤回應**

| 狀態碼 | 情境 | `code` | `message` |
|---:|---|---|---|
| 400 | `id` 不是合法 UUID | `VALIDATION_ERROR` | 類別 ID 格式錯誤 |
| 404 | UUID 不存在 | `NOT_FOUND` | 找不到指定資料 |
| 409 | 類別底下仍有 Skill | `CATEGORY_HAS_SKILLS` | 此類別尚有資料，請先移動或刪除 Skill |

---

## 後續待辦

- 若未來需要停用而不刪除類別，另行設計 `Enable/Disable` API；不可把軟刪除語意混入本端點。
- `Category.name` 的資料庫唯一性必須與本契約的 trim/case-insensitive 比較規則一致。
