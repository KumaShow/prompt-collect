# 部署規劃 — Prompt / Skill 收藏庫

> 狀態：**建議方案（尚未執行）**
> 目標：滿足「需有已上線、可以直接開啟的網站網址」的成果要求
> 依據：[PRD.md](../PRD.md)、專案 monorepo 結構（`apps/web`、`apps/api`）
> 建立：2026-08-13

**背景**：本專案為 Node.js 練習專案，程式碼存放於 GitHub Repo。前端（Vue 3 + Vite）尚未開始開發，後端（Express 5 + TypeORM + PostgreSQL）開發中，本地資料庫以 Docker Compose 執行。本文件整理前後端與資料庫的部署選項、推薦組合，以及上線前需要配合調整的程式碼項目。

---

## 一、推薦組合（結論）

| 部分 | 服務 | 費用 | HTTPS | 備註 |
|---|---|---|---|---|
| 前端 | Cloudflare Pages（直連 GitHub Repo） | 免費 | 預設提供 | 網址為 `https://<專案名>.pages.dev` |
| 後端 API | Render Web Service | 免費 | 預設提供 | 閒置 15 分鐘後休眠，冷啟動約 30–60 秒 |
| PostgreSQL | Neon（或 Supabase） | 免費 | — | 標準 Postgres 連線字串，需啟用 SSL |

三個服務都自帶 HTTPS 憑證，不需自行申請或管理。此組合對練習專案免費、設定成本最低。

**冷啟動注意事項**：Render 免費方案休眠後，第一個請求需等待喚醒。若網址是提供給審核者開啟，建議：

1. 在 README 註明「首次載入 API 較慢，約需 30–60 秒」
2. 審核／發表前自行先開啟一次網站喚醒服務

---

## 二、前端部署

### 方案 A：Cloudflare Pages 直連 GitHub（推薦）

Cloudflare Pages 可直接授權連接 GitHub Repo，push 到指定分支即自動建置部署，**不需要自行撰寫 GitHub Actions**。

Monorepo 相關設定：

| 設定項 | 值 |
|---|---|
| Root directory | `apps/web` |
| Build command | `pnpm build` |
| Output directory | `dist` |
| 環境變數 | `VITE_API_URL`（後端網址，建置時注入） |

Cloudflare 會偵測根目錄 `package.json` 的 `packageManager` 欄位自動使用 pnpm。

**SPA 路由**：Cloudflare Pages 對單頁應用有自動 fallback（找不到路徑時回傳 `index.html`），vue-router history mode 重新整理內頁不會 404，不需額外設定。

### 方案 B：GitHub Actions + wrangler 部署到 Cloudflare Pages

功能與方案 A 相同，差別在 CI 流程自行掌控（Actions 內跑 `pnpm build`，再以 `wrangler pages deploy` 上傳）。適合想額外練習 GitHub Actions 的情境，非必要。

### 其他替代方案

| 服務 | 評估 |
|---|---|
| GitHub Pages | 免費，但 SPA 路由需 `404.html` hack、網址帶 repo 子路徑需調整 Vite `base`，較麻煩 |
| Netlify / Vercel | 與 Cloudflare Pages 體驗類似，任選其一即可 |

---

## 三、後端部署

後端需要能長駐執行 Node.js process 並連線 PostgreSQL，靜態託管（Pages 類服務）無法承載。

### 方案：Render Web Service（推薦）

| 設定項 | 值 |
|---|---|
| Root directory | `apps/api` |
| Build command | `pnpm install && pnpm build` |
| Start command | `node dist/server.js` |
| 環境變數 | DB 連線資訊、JWT secret、CORS 允許來源等 |

**Migration 執行方式**（擇一）：

- Build command 尾端串接 `pnpm migration:run`
- 部署完成後手動執行一次

### 其他替代方案

| 服務 | 評估 |
|---|---|
| Zeabur | 台灣社群常用，介面友善、monorepo 支援好，但免費額度較緊 |
| Koyeb | 有免費方案，可作為 Render 備選 |
| Railway | 僅一次性試用額度，之後需付費 |
| Fly.io | 已無實質免費方案 |

---

## 四、資料庫

Render 自家免費 PostgreSQL 有到期限制，**不建議**作為長期練習用 DB。改用外部免費 Postgres：

| 服務 | 評估 |
|---|---|
| Neon（推薦） | Serverless Postgres，免費額度對練習專案充足 |
| Supabase | 免費 Postgres，另附帶 Auth／Storage 等功能（本專案用不到也不影響） |

兩者都提供標準 Postgres 連線字串，TypeORM 可直接使用，但**連線需啟用 SSL**（見下節第 3 點）。

---

## 五、上線前程式碼配合事項

| # | 項目 | 說明 |
|---|---|---|
| 1 | CORS 允許來源 | 將 Cloudflare Pages 網域加入 `cors` 允許清單，以環境變數設定、不寫死 |
| 2 | PORT | `server.ts` 需讀取 `process.env.PORT`（Render 會指定埠號） |
| 3 | DB 連線設定 | `data-source.ts` 改為從環境變數讀取，並支援雲端 DB 的 SSL 連線（如 `ssl: true`） |
| 4 | 健康檢查路由 | 新增 `GET /health` 端點，供平台檢查服務存活、也方便確認部署成功 |

---

## 六、建議執行順序

1. **前端先上線**：接上 Cloudflare Pages 取得網址（約半小時內可完成），即使前端只有初始畫面，也先滿足「有可開啟的網址」
2. **建立雲端 DB**：註冊 Neon，取得連線字串
3. **調整後端程式碼**：完成第五節的 4 個配合事項
4. **後端上線**：API 開發到一個段落後部署至 Render，設定環境變數並執行 migration
5. **串接**：在 Cloudflare Pages 設定 `VITE_API_URL` 指向 Render 網址，重新建置前端
