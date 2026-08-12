# Node.js ESM 專案的路徑別名限制：@ alias vs 相對路徑

- **紀錄代號**：express-typescript-003
- **分類**：Express + TypeScript
- **首次討論日期**：2026-08-11
- **最後更新日期**：2026-08-11
- **討論來源**：本次對話（型別檔案拆分後的 import 路徑討論）
- **相關檔案**：`apps/api/tsconfig.json`、`apps/api/package.json`、`apps/api/src/types/express/index.d.ts`
- **狀態**：建議方案；尚未實作
- **關鍵字**：`tsconfig paths`、`tsc-alias`、Node.js subpath imports、NodeNext、相對路徑

## 1. 討論問題

型別檔案拆分後出現 `../../` 這種多層相對路徑，是否該一律改用 `@` 路徑別名？

## 2. 問題現象與上下文

[apps/api/src/types/express/index.d.ts](../../../apps/api/src/types/express/index.d.ts) 需要：

```ts
import type { AuthTokenPayload } from '../../modules/auth/auth.types.js';
```

往上兩層，使用者擔心之後層數變深會難以維護。

## 3. 原因與關鍵觀念

- `tsconfig.json` 的 `paths` 設定只在 TypeScript **型別檢查**階段生效，Node.js **執行期**完全不認得 `@` 這種別名。
- 這個專案的建置流程是 `tsc -p tsconfig.build.json` 產出 `dist/`，再用 `node dist/server.js` 執行；`tsc` 編譯時不會重寫 import 路徑字串，若用了 `@` alias，編譯後的 JS 檔案會保留 `@/...` 字樣，`node` 執行時會找不到對應套件而報錯。
- 要讓 `@` alias 在執行期也能用，通常需要額外工具（例如 `tsc-alias`）在建置完成後重寫路徑，或改用 bundler；`dev` 用的 `tsx` 是否原生支援 `paths` 也需另外驗證，不是預設保證。
- [AGENTS.md](../../../AGENTS.md) 已明訂「API relative ESM imports must include the compiled `.js` suffix」，代表這個專案目前的既定慣例本來就是相對路徑加 `.js` 副檔名，不是 alias。
- 更輕量的替代方案：Node.js 原生的 **subpath imports**（`package.json` 的 `imports` 欄位，例如 `"imports": { "#modules/*": "./src/modules/*" }`），這是 Node.js 執行期原生支援的機制，`tsc` 編譯後路徑字串不變，不需要額外的建置工具或 polyfill。

## 4. 實際建議

1. 目前 import 深度只有 1-2 層（如 `../../modules/auth/auth.types.js`），不到需要改善的程度，維持現有相對路徑 + `.js` 副檔名的慣例。
2. 若未來出現 4 層以上的深層 import 造成閱讀困難，優先考慮 Node.js 原生的 `#` subpath imports，而非 TypeScript 的 `paths` / `@` alias（因為後者需要額外建置工具才能在執行期正確運作）。

## 5. 採用與驗證結果

| 建議 | 採用狀態 | 證據或結果 |
|---|---|---|
| 維持相對路徑，暫不導入 `@` alias | 已採用 | `apps/api/src/types/express/index.d.ts` 目前仍使用 `../../modules/auth/auth.types.js` 相對路徑 |
| 導入 `@` alias | 未採用 | 無程式碼異動 |
| 未來改用 Node.js subpath imports（`#`） | 待評估 | 尚未實作，僅列為未來選項 |

## 6. 容易混淆的觀念

- TypeScript 的 `paths` 只解決「編輯器與型別檢查」看不看得懂路徑，不解決「Node.js 執行期」找不找得到檔案；兩者是不同層級的問題，不能只設定 `tsconfig.paths` 就以為完工。
- `@` alias 與 Node.js 原生 `#` subpath imports 都能縮短路徑，但只有後者不需要額外建置工具即可在此專案（`tsc` + `node`，非 bundler）的執行期正確運作。

## 7. 後續行動

- [ ] 若專案後續 import 層數持續加深，評估導入 Node.js `#` subpath imports

## 8. 複習檢查清單

- [ ] 能否說出為什麼 `tsconfig.paths` 設定完，執行期還是可能找不到檔案？
- [ ] 能否說出 `@` alias 與 Node.js 原生 subpath imports（`#`）的差異？

## 9. 更新紀錄

| 日期 | 更新內容 | 驗證狀態 |
|---|---|---|
| 2026-08-11 | 首次整理：路徑別名限制與建議 | 建議方案；尚未實作 |
