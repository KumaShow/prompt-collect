# Skills 契約

> 全域約定（envelope、錯誤格式、分頁 G-04）見 [api-spec.md](../api-spec.md) 第一節，本檔不重複。
> 共通錯誤（401 `UNAUTHENTICATED`、403 `FORBIDDEN`、500 `INTERNAL_ERROR`）依錯誤碼表，各端點只列**特有**的錯誤。
> admin 端點（`/admin/skills/*`）與前台查詢操作同一個資源，契約放同一份檔案。

## `GET /skills`　🚧 待填

**權限**：已登入
**用途**：Skill 列表，支援關鍵字搜尋、類別篩選、分頁（PRD FR-08/10/11）

**Query 參數**

| 參數 | 型別 | 必填 | 驗證規則 | 預設 |
|---|---|:---:|---|---|
| `page` | number | ─ | 依 G-04 | 1 |
| `limit` | number | ─ | 依 G-04，上限 100 | 10 |
| `keyword` | string | ─ | ❓ trim 後比對；比對 title 就好還是含 content？大小寫敏感嗎？（ILIKE） | ─ |
| `categoryId` | number | ─ | 正整數；❓ 不存在的 categoryId 回空列表還是 404？ | ─ |

**Response 200**

```jsonc
{
  "status": "success",
  "message": "查詢成功",
  "data": [
    {
      "id": 1,
      "title": "Code Review Prompt",
      // ❓ 待填：列表每筆要哪些欄位？content 全文太肥，要不要截斷或乾脆不給？
      // ❓ category 要巢狀物件 { id, name } 還是攤平 categoryName？
      "isFavorited": true   // ❓ api-spec.md 第三節引導問題 4——本專案最值得想的一題，寫這份契約前必須回答
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 12, "totalPages": 2 }
}
```

**錯誤回應**

| 狀態碼 | 情境 | `code` | `message` |
|---:|---|---|---|
| 400 | page / limit / categoryId 非法 | `VALIDATION_ERROR` | ❓ |

**實作注意事項**
- 分頁用 `findAndCount()`（G-04 警告）
- 排序固定 `createdAt DESC`，不接受 sort 參數（G-04 決定）

---

## `GET /skills/:id`　🚧 待填

**權限**：已登入
**用途**：Skill 詳情（PRD FR-09）

**Path 參數**：`id` — 正整數

**Response 200**

```jsonc
{
  "status": "success",
  "message": "查詢成功",
  "data": {
    // ❓ 待填：詳情頁完整欄位（含 content 全文）
    // ❓ isFavorited 詳情頁也要嗎？（收藏按鈕在詳情頁也有）
  }
}
```

**錯誤回應**

| 狀態碼 | 情境 | `code` | `message` |
|---:|---|---|---|
| 400 | id 不是正整數 | `VALIDATION_ERROR` | ❓ |
| 404 | id 不存在 | `NOT_FOUND` | 找不到指定資料 |

---

## `POST /admin/skills`　🚧 待填

**權限**：admin
**用途**：新增 Skill（PRD FR-07）

**Request Body**

| 欄位 | 型別 | 必填 | 驗證規則 |
|---|---|:---:|---|
| `title` | string | ✅ | 不可空白；❓ 長度上限？ |
| `content` | string | ✅ | 不可空白；❓ 長度上限？ |
| `categoryId` | number | ❓ | ❓ 必填嗎？（對照 data-model.md：category FK 可不可為 NULL） |
| ❓ | | | ❓ 還有其他欄位嗎？（description？type：prompt/skill？對照 data-model.md） |

**Response 201**：❓ 待填（建議回建立後的完整物件）

**錯誤回應**

| 狀態碼 | 情境 | `code` | `message` |
|---:|---|---|---|
| 400 | 標題 / 內容空白 | `VALIDATION_ERROR` | 請輸入標題 / 請輸入內容（`errors` 明細） |
| ❓ | categoryId 不存在 | ❓ | ❓（400 還是 404？想想語意：是「輸入不合法」還是「資源不存在」） |

---

## `PATCH /admin/skills/:id`　🚧 待填

**權限**：admin
**用途**：編輯 Skill（PRD FR-14）

**Path 參數**：`id` — 正整數

**Request Body**：❓ 待填——PATCH 語意：欄位皆選填、只更新有帶的欄位。但「有帶但空白」要擋 `VALIDATION_ERROR`（「沒帶」和「帶空字串」是兩件事，zod 的 `.optional()` 處理前者）

**Response 200**：❓ 待填（建議回更新後的完整物件）

**錯誤回應**

| 狀態碼 | 情境 | `code` | `message` |
|---:|---|---|---|
| 400 | 有帶的欄位不合法 | `VALIDATION_ERROR` | ❓ |
| 404 | id 不存在 | `NOT_FOUND` | 找不到指定資料 |

---

## `DELETE /admin/skills/:id`　🚧 待填

**權限**：admin
**用途**：刪除 Skill（PRD FR-14）

**Path 參數**：`id` — 正整數

> 💭 Skill 被收藏中可以刪嗎？收藏紀錄（favorites）怎麼辦？（對照 data-model.md 的 FK——這裡通常 CASCADE 刪收藏紀錄是合理的，和 categories 的情境不同：收藏是「使用者與資料的關聯」，不是「使用者自己的內容」。你同意嗎？）

**Response**：❓ 200 還是 204？（與 `DELETE /admin/categories/:id` 的決定**必須一致**）

**錯誤回應**

| 狀態碼 | 情境 | `code` | `message` |
|---:|---|---|---|
| 404 | id 不存在 | `NOT_FOUND` | 找不到指定資料 |
