# Auth 契約

> 全域約定（envelope、錯誤格式、認證方式）見 [api-spec.md](../api-spec.md) 第一節，本檔不重複。
> 共通錯誤（401 `UNAUTHENTICATED`、500 `INTERNAL_ERROR`）依 [api-spec.md](../api-spec.md) 第二節錯誤碼表，各端點只列**特有**的錯誤。
> 驗證情境四件組（2xx / 400 / 401·403 / 邊界）見 [api-spec.md](../api-spec.md) 第五節。

## `POST /auth/login`　✅ 已定稿

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
  "message": "登入成功",
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
- 簽發時設定 `expiresIn`（`env.JWT_ACCESS_EXPIRES_IN`，已決定 `1h`）

---

## `POST /auth/logout`

**權限**：已登入
**用途**：登出（PRD FR-03）

> 💭 **先想清楚**：JWT 是無狀態的，後端沒有 session 可以銷毀。「登出」後端實際能做什麼？
> - 最簡方案：後端只回成功，前端刪掉 localStorage 的 token——token 在到期前其實仍有效
> - 完整方案：token blacklist（需要儲存與查詢，等於把無狀態變有狀態）——18 天工期下值得嗎？
> 你選哪個？理由寫下來，這是發表時的好題材。

**Request Body**：無

**Response 200**

```jsonc
{
  "status": "success",
  "message": "登出成功",
  "data": null
}
```

**錯誤回應**：無特有錯誤（僅共通 401 / 500）

**實作注意事項**
- 目前先使用最簡方案：後端不做任何事，前端刪掉 localStorage 的 token

---

## `GET /auth/me`

**權限**：已登入
**用途**：取得目前登入者資訊（前端重新整理後還原登入狀態用）

**Request**：無參數（身分來自 `Authorization` header）

**Response 200**

```jsonc
{
  "status": "success",
  "message": "查詢成功",
  "data": {
    "user": {
      "id": 1,
      "name": "管理員",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

**錯誤回應**：無特有錯誤（僅共通 401 / 500），token 過期 / 無效時：

```jsonc
{
  "status": "error",
  "code": "UNAUTHENTICATED",
  "message": "請先登入"
}
```

**實作注意事項**
- 白名單挑欄位，同 login 的警告
- ❓ token 有效但使用者已被刪除時回什麼？（401 還是 404？想想前端拿到後會做什麼）
  > 使用者已被刪除時，回 401 `UNAUTHENTICATED`。理由：
  > - 登入狀態已失效，請重新登入
  > 404 偏向找不到路由資源
