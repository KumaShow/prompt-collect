# Express module-based route 的拆分與註冊方式

- **紀錄代號**：express-typescript-006
- **分類**：Express + TypeScript
- **子主題**：route 組織、feature-based modules、middleware、API versioning
- **首次討論日期**：2026-08-12
- **最後更新日期**：2026-08-13
- **討論來源**：本次對話（NodeJS Express 路由管理）
- **相關檔案**：`apps/api/src/routes/index.ts`、`apps/api/src/modules/auth/auth.route.ts`、`apps/api/src/app.ts`
- **狀態**：部分完成
- **關鍵字**：Express routes、module-based architecture、controller、service、repository、schema、DTO、middleware、API versioning

## 1. 討論問題

Express 專案的 route 應如何拆分？在採用 `modules` 或 feature-based 結構時，route 要集中放在根層 `routes/`，還是跟著各自的 module 管理？同時需要釐清 route、controller、service、repository、schema、DTO、entity 的責任界線，以及 middleware 與 API versioning 的安排方式。

## 2. 一般 Express routes 的拆法

小型或以 layer-based 結構為主的專案，常見做法是將所有 HTTP route 放在根層：

```text
src/
├─ routes/
│  ├─ auth.routes.ts
│  ├─ user.routes.ts
│  └─ index.ts
├─ controllers/
├─ services/
└─ repositories/
```

每支 route 檔案建立一個 `Router`，只描述 HTTP method、URL、middleware 與 controller 的組合；`routes/index.ts` 再用 `/auth`、`/users` 等前綴集中掛載。這種方式容易理解，適合模組數量少、領域邊界尚未明確的專案。

## 3. module-based 架構下的 route 位置

當專案以功能模組拆分時，route 應跟著功能模組放置，避免重新退回所有責任分散在多個全域 layer 資料夾：

```text
src/
├─ routes/
│  └─ index.ts                  # 唯一的集中註冊入口
└─ modules/
   ├─ auth/
   │  ├─ auth.route.ts
   │  ├─ auth.controller.ts
   │  ├─ auth.service.ts
   │  ├─ auth.schema.ts
   │  └─ auth.dto.ts
   └─ users/
      ├─ user.route.ts
      ├─ user.controller.ts
      ├─ user.service.ts
      ├─ user.repository.ts
      ├─ user.entity.ts
      ├─ user.schema.ts
      └─ user.dto.ts
```

目前 `modules/auth/auth.route.ts` 管理 auth endpoint，根層 `src/routes/index.ts` 不實作業務邏輯，只負責 import auth router 並集中註冊：

```ts
router.use('/auth', authRouter)
```

未來建立 users module 後，再由同一入口加入 `router.use('/users', userRouter)`。

`app.ts` 目前以 `app.use('/api', routes)` 掛載這個入口。這樣可以同時保留單一掛載點與 module 的內聚性；users module 與完整 module 化結構仍尚未建立。

## 4. 各層責任界線

| 層級 | 主要責任 | 不應負責 |
|---|---|---|
| route | 定義 HTTP method、path、middleware 順序與 controller 對應 | 業務判斷、資料庫查詢、組裝複雜 response |
| controller | 讀取 request、呼叫 service、建立成功 response、把錯誤交給 `next(error)` | 直接撰寫 SQL、承擔完整業務流程 |
| service | 執行商業規則、協調 repository、決定領域錯誤語意 | 依賴 Express `Request`/`Response` 或直接操作 HTTP response |
| repository | 封裝 Entity/ORM 的查詢與持久化 | 判斷 HTTP status、處理 request 欄位 |
| schema | 驗證輸入資料、query、params 或 body 的形狀與限制 | 取代 service 的商業規則 |
| DTO | 定義輸入／輸出資料的邊界與轉換形狀 | 直接代表完整資料庫 Entity |
| entity | 描述資料庫表格、欄位、關聯與 ORM metadata | 作為 HTTP request validation 或 response 的唯一格式 |

`auth` 與 `users` 應維持不同 route 模組：auth 處理註冊、登入、refresh token 等認證流程；users 處理使用者資料的查詢與修改。即使兩者都會讀取 User entity，也不代表應共用同一支 route 檔案。

## 5. Middleware 的判斷方式

先依影響範圍決定位置：

- **global middleware**：所有或幾乎所有請求都需要，例如 JSON body parser、CORS、helmet、request logging、rate limit 或統一錯誤處理。這些通常在 `app.ts` 或根層 middleware 統一註冊。
- **module／route middleware**：只有某個領域或 endpoint 需要，例如 `authMiddleware`、角色檢查、特定資源權限與該 route 的輸入驗證。這些應在 module route 附近組合，避免全域套用造成不必要的耦合。

Middleware 的順序是行為的一部分。常見流程是：global middleware → module route middleware → controller → service；錯誤則由 controller 透過 `next(error)` 傳給最後註冊的 error middleware。驗證失敗應在進入 controller 前結束，認證 middleware 則應在需要登入的 route 前執行。

## 6. 何時再細拆 routes

不要只因檔案變長就立即拆分。當以下任一情況成立時，再依資源或 use case 拆成多支 route：

- 同一 module 同時包含多個清楚且可獨立理解的資源或流程。
- middleware、權限規則或 API version 只適用於其中一部分 endpoint。
- route 檔案難以在一次閱讀中掌握，或多人經常同時修改造成衝突。
- endpoint 已形成不同的生命週期、文件群組或測試群組。

例如 users module 可以從 `user.route.ts` 拆成 `user-profile.route.ts`、`user-admin.route.ts`；但仍由該 module 的入口或根層 `routes/index.ts` 統一掛載。拆分後若只是把幾行 route 分散到更多檔案，卻沒有清楚的責任邊界，就不值得增加導航成本。

## 7. API versioning 建議

API version 應在邊界層表達，常見做法是：

```text
/api/v1/auth
/api/v1/users
```

由 `app.ts` 或根層 route 入口掛載 `/api/v1`，module route 只保留 `/auth`、`/users` 等領域路徑。若未來出現不相容變更，可新增 `v2` 入口，讓 `v1` 與 `v2` 在一段相容期內並存；不要把 `/v1` 散落在每個 module route 的字串中。

版本升級前應先判斷是否真的屬於 breaking change。欄位新增、可選參數增加通常可以維持相容；移除欄位、改變既有語意或 response 結構，才需要評估新版本、deprecation 與 migration 說明。版本策略要與 OpenAPI 文件、DTO/schema、前端 client 及測試同步。

## 8. 採用與驗證結果

| 建議 | 採用狀態 | 證據或結果 |
|---|---|---|
| route 跟著 module 放置 | 部分採用 | `auth.route.ts` 已放在 auth module；users 等其他 module 尚未盤點完成 |
| `src/routes/index.ts` 作為集中註冊入口 | 已採用；尚未驗證 | `routes/index.ts` 已組裝 auth router，`app.ts` 已掛載 `/api`；尚未以 API integration test 驗證 |
| auth 與 users route 分離 | 待處理 | auth route 已存在，users module 尚未建立 |
| global 與 module middleware 依影響範圍分層 | 建議採用 | 本筆記整理判斷準則，未新增 middleware |
| API versioning 由邊界前綴管理 | 待評估 | 尚未決定目前 API 的正式版本策略 |

## 9. 容易混淆的觀念

- module-based 不代表完全取消根層 `routes/index.ts`；module 內聚與根層集中組裝可以同時成立。
- route 檔案不是 controller 的別名；route 描述 HTTP 組合，controller 才處理 request/response 邊界。
- DTO/schema 與 entity 的形狀可能不同；資料庫欄位不應因而直接暴露成公開 API。
- middleware 的「全域」與「共用」不是同一件事；一個 middleware 可以被多個 module 使用，但仍只在需要的 route 掛載。
- API versioning 是公開契約的相容性策略，不是單純為 URL 加上字串；文件、型別、測試與 deprecation 都必須同步考量。

## 10. 後續行動

- [x] 確認 `apps/api/src/routes/index.ts` 只負責 router 組裝，沒有混入業務邏輯。
- [ ] 盤點目前 `apps/api/src/modules/` 的功能邊界，確認每個 module 是否已有自己的 route。
- [ ] 為需要登入、角色或資源權限的 endpoint 列出 module-level middleware，避免不必要的 global middleware。
- [ ] 在正式公開 API 前決定 `/api/v1` 是否作為第一版前綴，並同步 OpenAPI 文件與測試。
- [ ] 當 route 檔案達到明確資源或 use case 邊界時，再拆分並維持單一掛載入口。

## 11. 複習檢查清單

- [ ] 能說明一般 layer-based routes 與 module-based routes 的差異。
- [ ] 能指出 `src/routes/index.ts` 與各 module `*.route.ts` 的責任差異。
- [ ] 能說明 route、controller、service、repository、schema、DTO、entity 各自不應越界的部分。
- [ ] 能依影響範圍判斷 middleware 應放在 global 還是 module/route 層。
- [ ] 能判斷何時值得再細拆 route，並說明 API version 前綴應放在哪一層。

## 12. 更新紀錄

| 日期 | 更新內容 | 驗證狀態 |
|---|---|---|
| 2026-08-12 | 首次整理 Express routes 拆分、module-based route、責任分層、middleware 與 API versioning 建議 | 架構建議；尚未實作驗證 |
| 2026-08-13 | 依目前 `auth.route.ts`、`routes/index.ts` 與 `app.ts` 實作更新採用狀態 | 部分完成；integration test 尚未驗證 |
