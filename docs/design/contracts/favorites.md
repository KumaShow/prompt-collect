# Favorites 契約

> 全域約定（envelope、錯誤格式、分頁 G-04）見 [api-spec.md](../api-spec.md) 第一節，本檔不重複。
> 共通錯誤（401 `UNAUTHENTICATED`、500 `INTERNAL_ERROR`）依錯誤碼表，各端點只列**特有**的錯誤。
> 權限一律 **`已登入`**（不掛 `requireRole('member')`）——依 data-model.md 假設 A-02「管理者也可以收藏」，這是刻意偏離 PRD 的決定（api-spec.md 第三節有變更紀錄）。

## `POST /favorites/:skillId`　🚧 待填

**權限**：已登入
**用途**：收藏 Skill（PRD FR-12）

**Path 參數**：`skillId` — 正整數

**Request Body**：無（要收藏誰=path，收藏者=token，不需要 body）

**Response 201**

```jsonc
{
  "status": "success",
  "message": "收藏成功",
  "data": null   // ❓ 要回什麼？null？收藏紀錄？該 skill 的最新收藏數？想想前端拿到後要做什麼
}
```

**錯誤回應**

| 狀態碼 | 情境 | `code` | `message` |
|---:|---|---|---|
| 400 | skillId 不是正整數 | `VALIDATION_ERROR` | ❓ |
| 404 | skill 不存在 | `NOT_FOUND` | 找不到指定資料 |
| 409 | 已經收藏過 | `ALREADY_FAVORITED` | 已經收藏過此項目 |

**實作注意事項**
- ❓ 「已收藏」的判斷怎麼做才不會 race condition？（先查再插 vs 直接插靠 DB unique constraint 接 409——對照 data-model.md 的複合唯一鍵設計）

---

## `DELETE /favorites/:skillId`　🚧 待填

**權限**：已登入
**用途**：取消收藏

**Path 參數**：`skillId` — 正整數

**Response**：❓ 200 還是 204？（與 admin 的 DELETE 決定一致）

**錯誤回應**

| 狀態碼 | 情境 | `code` | `message` |
|---:|---|---|---|
| 404 | ❓ 「skill 不存在」和「skill 存在但你沒收藏過」都回 404 嗎？還是後者是冪等操作直接回成功？寫下你的語意 | `NOT_FOUND` | ❓ |

---

## `GET /me/favorites`　🚧 待填

**權限**：已登入
**用途**：我的收藏列表（PRD FR-13）

**Query 參數**：依 G-04 分頁（`page` / `limit`）；❓ 要不要支援 `keyword` / `categoryId` 篩選？（PRD 沒要求，做了前端「我的收藏」頁才能搜——先確認前端有沒有這個 UI 再決定）

**Response 200**

```jsonc
{
  "status": "success",
  "message": "查詢成功",
  "data": [
    // ❓ 待填：每筆的形狀建議與 GET /skills 列表同形（前端可共用同一個卡片元件）
    // 這裡不需要 isFavorited——都在收藏列表裡了，必為 true（還是為了同形統一帶 true？你決定）
  ],
  "pagination": { "page": 1, "limit": 10, "total": 3, "totalPages": 1 }
}
```

**錯誤回應**：無特有錯誤

**實作注意事項**
- 排序固定 `createdAt DESC`——❓ 這裡的 createdAt 是「收藏時間」還是「Skill 建立時間」？兩者不同，契約要寫明
