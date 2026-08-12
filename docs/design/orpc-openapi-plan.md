# oRPC + OpenAPI（Swagger）後續導入設計

> 狀態：**後續待優化（非目前優先項目）**
> 建議時機：MVP API 與前端主流程完成、現有 REST 契約穩定之後
> 建立：2026-08-09
> 相關文件：[API 契約](./api-spec.md)／[開發 TODO](../TODO.md)

---

## 一、結論

本專案若要導入 oRPC，建議採用 **contract-first + OpenAPI transport**：

1. 在 `packages/contracts` 用 Zod 與 `@orpc/contract` 定義唯一的 API 契約。
2. `apps/api` 用 `@orpc/server` 實作契約，以 `OpenAPIHandler` 接入既有 Express 5。
3. `@orpc/openapi` 依同一份契約產生 OpenAPI 3.1.1 規格與 Swagger UI。
4. `apps/web` 用 `@orpc/client` + `@orpc/openapi-client` 呼叫同一組 REST API。

這項調整的主要價值不只是「有 Swagger 頁面」，而是讓下列內容共用同一個來源：

- 前後端 TypeScript 型別
- request／response 的 Zod runtime validation
- HTTP method、path、status code 與錯誤格式
- OpenAPI JSON 與 Swagger UI

目前應先完成既定 MVP。現在切換路由架構會同時影響登入、權限、錯誤處理、前端資料存取與測試，範圍比單純安裝 Swagger 套件大，因此列為後續優化。

---

## 二、近期討論與目前專案狀態

### 2.1 先前 Swagger 討論的結論

近期 session 原本評估的是：

- 使用 `swagger-jsdoc` 從 route 內的 `@openapi` JSDoc 註解產生規格。
- 使用 `swagger-ui-express` 提供文件頁面。
- 規格設定預計放在 `apps/api/src/config/swagger.ts`，或維護獨立的 `apps/api/openapi.yaml`。
- 專案是 NodeNext／ESM，若套件仍以 CommonJS 發布，需要確認 import 相容性。
- 預計驗證 `/api-docs` 與 OpenAPI JSON endpoint，但當時沒有安裝套件或完成實測。

這個方案能產生文件，但 TypeScript handler、Zod validation 與 JSDoc／YAML 仍可能各自變動。oRPC 的差異是改由可執行的契約產生型別、驗證與 OpenAPI，減少規格漂移。

### 2.2 目前工作區的相關事實

- `apps/api` 使用 Express 5、TypeScript、NodeNext／ESM，並已安裝 Zod 4。
- `apps/web` 使用 Vue 3、Vite 與 Pinia，目前尚未安裝 API client 或 server-state query library。
- `packages/contracts/package.json` 已存在，適合作為共用契約 package，不需另建同用途資料夾。
- `apps/api/openapi.yaml` 已有 `/health` 的 OpenAPI 3.1.1 草稿。
- `apps/api/src/app.ts` 有尚未啟用的 Swagger 掛載註解；`server.ts` 已輸出 Swagger URL。
- `docs/design/api-spec.md` 仍有多項全域契約待決策。

因此，未來導入 oRPC 時應把 `api-spec.md` 的決策落到 `packages/contracts`；既有 `openapi.yaml` 可當遷移比對資料，但不應與 oRPC 產生的規格永久並行維護。

---

## 三、名詞與責任邊界

| 名稱           | 在本方案中的角色                                                      |
| -------------- | --------------------------------------------------------------------- |
| OpenAPI        | API 的機器可讀規格；本方案使用 oRPC 支援的 OpenAPI 3.1.1              |
| Swagger UI     | 顯示及試打 OpenAPI 規格的文件介面                                     |
| oRPC contract  | 定義 input、output、errors、HTTP route metadata 的唯一來源            |
| OpenAPIHandler | 讓 Express 收到的 HTTP request 依 oRPC router 執行，對外仍是 REST API |
| OpenAPILink    | Vue 前端依 contract 呼叫 OpenAPIHandler 的型別安全 client transport   |

Swagger UI 是文件顯示層，不應再承擔規格來源；真正的來源是 contract。

---

## 四、需要安裝的套件

### 4.1 `packages/contracts`

| 套件             | 用途                                             | 必要性   |
| ---------------- | ------------------------------------------------ | -------- |
| `@orpc/contract` | 定義 contract-first procedure 與 contract router | 必要     |
| `zod`            | input、output、error data 的 runtime schema      | 必要     |
| `typescript`     | 建置 declarations 與 project references          | 開發依賴 |

```powershell
pnpm --filter @prompt-collect/contracts add @orpc/contract zod
pnpm --filter @prompt-collect/contracts add -D typescript
```

### 4.2 `apps/api`

| 套件                        | 用途                                                        | 必要性 |
| --------------------------- | ----------------------------------------------------------- | ------ |
| `@orpc/server`              | contract 實作、middleware、context、錯誤處理與 Node adapter | 必要   |
| `@orpc/openapi`             | OpenAPIHandler、規格與 API reference plugin                 | 必要   |
| `@orpc/zod`                 | 將 Zod 4 schema 轉成 OpenAPI JSON Schema                    | 必要   |
| `@prompt-collect/contracts` | workspace 共用契約                                          | 必要   |

```powershell
pnpm --filter @prompt-collect/api add @orpc/server @orpc/openapi @orpc/zod "@prompt-collect/contracts@workspace:*"
```

`apps/api` 已有 `zod`，不需重複新增。導入完成後不需要 `swagger-jsdoc`、`swagger-ui-express` 及其 `@types/*`；oRPC 的 reference plugin 可直接提供 Swagger UI。

### 4.3 `apps/web`

| 套件                        | 用途                                                | 必要性 |
| --------------------------- | --------------------------------------------------- | ------ |
| `@orpc/client`              | 建立型別安全 client                                 | 必要   |
| `@orpc/contract`            | 使用 `ContractRouterClient` 等 contract client 型別 | 必要   |
| `@orpc/openapi-client`      | 透過 REST／OpenAPI transport 呼叫後端               | 建議   |
| `@prompt-collect/contracts` | 取得 contract router 型別                           | 必要   |

```powershell
pnpm --filter @prompt-collect/web add @orpc/client @orpc/contract @orpc/openapi-client "@prompt-collect/contracts@workspace:*"
```

前期可直接在 Pinia store 或 composable 呼叫 client，不需要為了 oRPC 立刻加入另一套狀態管理。若之後確實需要 request cache、retry、失效更新與 optimistic update，再擇一加入：

```powershell
# 選項 A：較成熟、功能完整
pnpm --filter @prompt-collect/web add @orpc/vue-query @tanstack/vue-query

# 選項 B：更貼近 Vue／Pinia，但官方目前仍標示為不穩定
pnpm --filter @prompt-collect/web add @orpc/vue-colada @pinia/colada
```

本專案建議先不安裝這兩組 optional integration；若未來需要，優先評估 TanStack Vue Query，且不要同時導入兩套。

### 4.4 版本策略

- 實作當天再查 oRPC 官方文件與最新穩定版，所有 `@orpc/*` 套件盡量使用相同版本。
- 安裝後由 `pnpm-lock.yaml` 固定實際版本，不在此規劃文件寫死容易過期的 latest 版號。
- 先在單一 health procedure 做相容性 spike，再批次遷移 routes。
- 每次升級一起升級 oRPC 套件並跑 contract、API、前端與 OpenAPI 驗證，不分開漂移。

---

## 五、建議資料夾結構

```text
apps/
├─ api/
│  └─ src/
│     ├─ app.ts                         # Express middleware 與 oRPC handler 掛載
│     ├─ config/
│     │  └─ env.ts
│     ├─ database/
│     ├─ orpc/
│     │  ├─ context.ts                  # request headers、DataSource 等 initial context
│     │  ├─ middleware/
│     │  │  ├─ auth.middleware.ts                  # JWT 驗證並注入 user
│     │  │  └─ require-role.ts          # admin/member 授權
│     │  ├─ router.ts                   # 組合所有 procedure implementations
│     │  └─ handler.ts                  # OpenAPIHandler + Swagger plugin
│     └─ modules/
│        ├─ auth/
│        │  ├─ auth.service.ts
│        │  └─ auth.procedure.ts        # 實作 contract.auth
│        ├─ categories/
│        ├─ skills/
│        └─ favorites/
│
├─ web/
│  └─ src/
│     ├─ api/
│     │  ├─ client.ts                   # OpenAPILink + createORPCClient
│     │  └─ errors.ts                   # 統一處理已定義／未知錯誤
│     ├─ composables/
│     └─ stores/
│
packages/
└─ contracts/
   ├─ package.json
   ├─ tsconfig.json                     # composite + declaration
   └─ src/
      ├─ index.ts                       # 對外唯一入口
      ├─ common/
      │  ├─ errors.ts
      │  └─ pagination.ts
      ├─ auth.contract.ts
      ├─ categories.contract.ts
      ├─ skills.contract.ts
      ├─ favorites.contract.ts
      └─ router.ts                      # root contract router
```

### 結構原則

- `packages/contracts` 只能包含可安全送到瀏覽器的 schema、route metadata 與型別。
- 不得從 contract package import TypeORM Entity、DataSource、JWT secret 或 server handler。
- `apps/api` 負責資料庫、驗證身分、授權與商業邏輯。
- `apps/web` 只透過 contract client 存取 API，不直接 import `apps/api`。
- workspace package 使用 TypeScript project references；`packages/contracts` 開啟 `composite` 並輸出 declarations。
- 不新增 `@/*` alias 來跨 app 引用，使用 `@prompt-collect/contracts` workspace dependency。

---

## 六、契約設計方式

以下只示意責任分配，實作時應以 [api-spec.md](./api-spec.md) 的最終決策為準：

```ts
import { oc } from "@orpc/contract";
import * as z from "zod";

const HealthOutputSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.iso.datetime(),
});

export const healthContract = oc
  .route({
    method: "GET",
    path: "/health",
    summary: "檢查 API 狀態",
    tags: ["System"],
  })
  .output(HealthOutputSchema);
```

每個 contract 至少要明確定義：

- HTTP method 與 path
- input 位於 path、query 或 body 的方式
- success status（例如建立成功為 201）
- output schema
- 可預期 errors 與 HTTP status
- Swagger 顯示用的 summary、description、tags

### 與 `api-spec.md` 的分工

- `api-spec.md`：保留設計理由、選項取捨與人類可讀的全域決策。
- `packages/contracts`：成為可執行、可測試、可產生 OpenAPI 的正式契約。
- 兩者衝突時，不可默默各走各的；先更新設計決策，再同步 contract。

---

## 七、後端接入 Express 5

### 7.1 實作 contract

API 使用 `implement(contract)` 建立 implementer，再讓各 module 的 procedure 接上 service：

```ts
import { implement } from "@orpc/server";
import { contract } from "@prompt-collect/contracts";

export const os = implement(contract);

export const health = os.health.handler(async () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
}));

export const router = os.router({ health });
```

handler 不應直接堆 TypeORM query；保留 `procedure -> service -> repository/Entity` 的分工，方便測試與未來替換 transport。

### 7.2 掛載 OpenAPIHandler

建議對外路徑：

| URL                 | 用途                                                         |
| ------------------- | ------------------------------------------------------------ |
| `/api/*`            | 實際 REST API                                                |
| `/api/docs`         | Swagger UI                                                   |
| `/api/openapi.json` | OpenAPI 3.1.1 JSON                                           |
| `/health`           | 可暫時保留為平台健康檢查，或最後納入 `/api/health`，需先決策 |

`OpenAPIReferencePlugin` 設定 `docsProvider: 'swagger'`，並用 `ZodToJsonSchemaConverter` 轉換 Zod 4 schema。`docsPath`、`specPath` 應明確指定，不依賴 plugin 預設值。

Express 5 adapter 的重要限制：oRPC middleware 應放在 `express.json()`／`express.urlencoded()` 之前，或只讓 body parser 套用到非 oRPC routes。否則 Express 先解析 body 後，檔案上傳及 bracket notation 等格式可能失去 oRPC 預期行為。

建議 middleware 順序：

```text
helmet
→ cors
→ oRPC OpenAPI handler (/api)
→ express.json / express.urlencoded（只服務保留的 legacy routes）
→ legacy Express routes
→ not-found / error handler
```

目前 `app.ts` 是先全域註冊 body parser；導入時必須調整順序並補 integration test。

### 7.3 JWT 與角色權限

- handler 的 initial context 傳入 request headers 與必要的 server dependencies。
- oRPC auth middleware 從 `Authorization` header 驗證 JWT，成功後將 `user` 注入 execution context。
- protected procedure 共用 `authorized` base；admin procedure 再套 `requireRole('admin')`。
- contract 預先定義 `UNAUTHORIZED`、`FORBIDDEN` 等錯誤，讓前端能型別安全處理。
- 錯誤 data 會送到 client，不可包含 token、password hash、stack trace 或資料庫內容。

### 7.4 錯誤格式

oRPC 會把常用錯誤碼對應到 HTTP status，例如 `BAD_REQUEST` 400、`UNAUTHORIZED` 401、`FORBIDDEN` 403、`NOT_FOUND` 404、`CONFLICT` 409。

導入前需先完成 `api-spec.md` 的 G-02 決策：

- 若接受 oRPC 預設錯誤格式，contract、OpenAPIHandler 與 OpenAPILink 最單純。
- 若要維持自訂 `{ status, code, message }`，必須同時設定 server encoder、OpenAPI error schema 與 client decoder，測試成本較高。

建議優先採 oRPC 預設格式，除非既有前端已大量依賴另一種格式。

---

## 八、前端使用方式

### 8.1 建立 client

```ts
import type { JsonifiedClient } from "@orpc/openapi-client";
import type { ContractRouterClient } from "@orpc/contract";
import { createORPCClient } from "@orpc/client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { contract } from "@prompt-collect/contracts";

const link = new OpenAPILink(contract, {
  url: `${import.meta.env.VITE_API_BASE_URL}/api`,
  fetch: (request, init) =>
    globalThis.fetch(request, {
      ...init,
      credentials: "include",
    }),
});

export const apiClient: JsonifiedClient<ContractRouterClient<typeof contract>> =
  createORPCClient(link);
```

若最終 JWT 放在 `Authorization` header，改由 `headers` callback 從 auth store 取得 token；若改用 HttpOnly cookie，保留 `credentials: 'include'` 並正確設定 CORS。

### 8.2 在 Vue／Pinia 中呼叫

```ts
const result = await apiClient.skills.list({
  page: 1,
  limit: 10,
  keyword: searchText.value || undefined,
});
```

建議：

- `api/client.ts` 只建立 transport 與共用 headers／error interceptor。
- Pinia store 管登入狀態、使用者狀態與跨頁 UI 狀態。
- 頁面級資料可先由 composable 呼叫 client；需要 cache 時再加 Vue Query。
- 使用 `isDefinedError` 或 `safe` 分辨 contract 已定義錯誤與未知錯誤，不以中文 message 判斷流程。

### 8.3 JSON 型別限制

OpenAPILink 經過 JSON 傳輸後，`Date`、`BigInt` 等型別不會原樣保留，因此 client 型別需使用 `JsonifiedClient`。本專案 API 建議直接把時間欄位定義為 ISO datetime string，與目前 JSON／OpenAPI 設計一致，可降低轉換歧義。

---

## 九、導入順序

### Stage 0：決策完成

- [ ] 完成 `api-spec.md` 的 envelope、錯誤格式、命名、分頁與 auth 傳遞方式。
- [ ] 決定 health endpoint 最終是 `/health` 或 `/api/health`。
- [ ] 決定 Swagger UI 是否只在 development／staging 開放；production 若開放，是否需要保護。

### Stage 1：最小 spike

- [ ] 完成 `packages/contracts` 的 package、TypeScript build 與 project references。
- [ ] 安裝並鎖定同一組 oRPC 套件版本。
- [ ] 只建立 `health` contract、implementation 與 OpenAPIHandler。
- [ ] 驗證 `/api/docs`、`/api/openapi.json` 及 health request。
- [ ] 驗證 NodeNext／ESM build，而不只跑編輯器型別提示。

### Stage 2：垂直切片

- [ ] 選一個低風險 module（建議 categories list）完成 contract → service → procedure → Vue client。
- [ ] 測試 query coercion、output validation、404／validation error。
- [ ] 確認 Swagger UI 可直接試打且 response 與前端收到的一致。

### Stage 3：逐模組遷移

- [ ] auth
- [ ] categories
- [ ] skills
- [ ] favorites
- [ ] admin role protection
- [ ] 移除被取代的 Express routes 與重複 schema

### Stage 4：收尾

- [ ] 移除或封存手寫 `openapi.yaml`，不得保留兩份正式規格來源。
- [ ] 移除 `app.ts` 的舊 Swagger 註解與失效 server log。
- [ ] 更新 README、環境變數範例及 API 開發流程。
- [ ] 將產生的 OpenAPI JSON 納入 CI drift／snapshot 檢查（若團隊認為有價值）。

---

## 十、驗收條件

完成導入不能只以「Swagger 頁面打得開」判定，至少需要：

- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `pnpm lint`
- [ ] API unit／integration tests 通過
- [ ] web unit tests 通過
- [ ] contract package 可獨立 build 並輸出 declarations
- [ ] `/api/docs` 正常顯示 Swagger UI
- [ ] `/api/openapi.json` 是合法 OpenAPI 3.1.1 文件
- [ ] Swagger UI 可測通至少一個 GET、一個 POST、一個驗證錯誤與一個授權錯誤
- [ ] Vue client 能推斷 input、output 與已定義 error 型別
- [ ] 修改 contract 後，錯誤的 API implementation 與前端呼叫都會在 typecheck 被抓到
- [ ] production 設定不會意外公開不該公開的內部 procedure 或敏感錯誤資料

---

## 十一、主要風險與取捨

| 風險／代價                                          | 對策                                                                 |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| oRPC 是架構調整，不只是文件套件                     | MVP 後導入；先做 health spike                                        |
| contract-first 增加 workspace package 與 build 關係 | 使用 project references、workspace protocol 與 topological build     |
| 手寫 YAML、JSDoc、Zod、contract 同時存在會漂移      | oRPC contract 定為唯一正式來源                                       |
| Express body parser 順序不相容                      | oRPC handler 放在 parser 前，並加 multipart/query integration test   |
| OpenAPILink 受 JSON 型別限制                        | API 邊界優先使用 JSON-friendly schema；client 使用 `JsonifiedClient` |
| 自訂錯誤 envelope 增加三端設定                      | 優先採 oRPC 預設錯誤格式                                             |
| 將 server router 直接匯入 web 可能夾帶後端程式      | web 只 import `packages/contracts`，不 import `apps/api`             |
| Swagger 文件可能暴露內部端點                        | 用 tags/filter 排除 internal procedure，並決定 production 開放策略   |
| oRPC API 可能隨版本改動                             | 鎖定版本、同批升級、以官方文件與 spike 驗證實際 imports              |

---

## 十二、不在本次規劃內

- 現在安裝 oRPC 或 Swagger 套件
- 修改既有 Entity、migration 或資料庫設計
- 立即把 Express routes 改寫成 procedure
- 立即移除 `openapi.yaml`
- 為了 oRPC 同時導入 Vue Query／Pinia Colada
- 部署 Swagger UI 到 production

以上都應等此待辦正式排入優先順序後再執行。

---

## 十三、官方參考資料

- [oRPC Contract First：Define Contract](https://orpc.dev/docs/contract-first/define-contract)
- [oRPC Contract First：Implement Contract](https://orpc.dev/docs/contract-first/implement-contract)
- [oRPC Monorepo Setup](https://orpc.dev/docs/best-practices/monorepo-setup)
- [oRPC Express Adapter](https://orpc.dev/docs/adapters/express)
- [oRPC OpenAPI Handler](https://orpc.dev/docs/openapi/openapi-handler)
- [oRPC OpenAPI Specification](https://orpc.dev/docs/openapi/openapi-specification)
- [OpenAPI Reference Plugin（Swagger／Scalar）](https://orpc.dev/docs/openapi/plugins/openapi-reference)
- [oRPC OpenAPILink](https://orpc.dev/docs/openapi/client/openapi-link)
- [oRPC Error Handling](https://orpc.dev/docs/error-handling)
