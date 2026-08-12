---
name: git-commit-advisor
description: 分析 Git repository 的 staged、unstaged、untracked 與 deleted 異動，依功能目的、依賴關係、測試及文件一致性判斷哪些檔案適合一起 git add，並提出可直接使用的 Conventional Commit 訊息。Use whenever the user asks to 檢查異動、整理 commit、建議 git add、拆分 commits、撰寫 commit message、準備提交或確認哪些檔案應一起提交。預設只提供建議；只有使用者明確要求時才執行 git add 或 git commit，且不主動 push。
---

# Git Commit Advisor

根據目前 repository 的實際異動，整理邏輯完整、可審查且可獨立回復的 commit 建議。分析「為什麼檔案應一起提交」，不要只依目錄或副檔名分組。

## 核心原則

- 預設進行唯讀分析。使用者沒有明確要求執行時，不執行 `git add`、`git commit`、`git push`、`git reset`、`git restore` 或其他會改變 repository 狀態的操作。
- 「幫我看怎麼 commit」、「整理一下 commit」或「給我 commit 訊息」都只代表提供建議，不代表授權提交。
- 使用者明確要求 commit 時，只 stage 並提交已確認的那一組異動。除非另有明確要求，不 amend、不 push，也不處理其他組。
- 保留使用者既有 staged 狀態。若 staged 區混入不同目的的變更，先指出問題並建議如何拆分，不擅自重排。
- 每個建議或實際使用的 commit 訊息都包含 subject 與條列式 body；body 讓日後只看 Git history 也能理解此 commit 的具體內容。只有使用者明確要求單行訊息時才省略 body。
- Commit 訊息只描述產品或程式碼本身的變更，不把 AI、agent、assistant、模型或其他自動化工具寫成作者、協作者或內容產生來源，也不加入相關共同作者 trailer。若異動本身就是 AI 產品功能，仍應如實描述功能，不混入協作歸因。
- 不因分析需要而修改全域或 repository Git 設定。遇到 `safe.directory` 等環境問題時，優先使用單次唯讀參數；無法安全讀取時再說明限制。

## 分析流程

### 1. 確認 repository 與規範

1. 確認目前路徑位於 Git worktree，找出 repository root 與目前 branch。
2. 讀取 root 到異動檔案路徑間適用的 `AGENTS.md`、`CONTRIBUTING.md` 或 commit 規範。
3. 查看近期 commit subjects，以 repository 的既有 scope、語言與措辭為優先；若既有歷史不一致，採用清楚的 Conventional Commit。

### 2. 建立完整異動清單

至少檢查：

- staged、unstaged、untracked、deleted、renamed 與 conflict 狀態。
- staged diff 與 unstaged diff 的檔名、統計和必要內容。
- untracked 檔案的實際內容或結構；`git diff` 不會顯示它們，不可因此忽略。
- submodule、產物、cache、secret、`.env`、大型 binary 或疑似暫存檔等不應直接提交的項目。

先取得全貌，再深入閱讀足以判斷目的的 diff。不要為省事而把所有異動歸成同一組。

### 3. 判斷相關性

適合放在同一 commit 的常見關係：

- 同一項使用者可觀察行為或同一個修正。
- 實作與直接驗證該實作的測試。
- schema/entity 與使該變更可部署的 migration。
- 程式碼與因該變更而必須同步的設定、型別或公開文件。
- rename 與為維持引用正確所需的連動更新。

通常應拆開的情況：

- 不同功能、不同 bug 或可獨立回復的目的。
- 純格式化／機械重構與行為變更混在一起，且可安全分離。
- 開發問題筆記、一般文件整理與產品程式碼沒有直接交付依賴。
- 產生檔、個人設定、debug 輸出或秘密資料。
- 只有部分 hunk 與目標相關；這時建議互動式 staging，不假裝整個檔案都相關。

每個分組都說明納入理由；對無法從 diff 確認的關係標為「待確認」，不要自行編造需求背景。

### 4. 提出 staging 建議

對每個建議 commit 列出：

1. 目的：一句話說明此組完成的單一工作。
2. 建議納入：逐一列出檔案，簡述各自角色。
3. 暫不納入：列出看似無關、風險較高或需要使用者確認的異動。
4. 建議指令：提供精確且可複製的 `git add -- <paths>`；路徑含空白時正確引用。需要挑選部分 hunk 時使用 `git add -p -- <path>`。
5. Commit 訊息：依下節格式提供。

刪除檔與 rename 也要納入建議路徑。若一個檔案橫跨多個目的，清楚指出需用 patch staging，並提醒使用者逐個 hunk 檢查。

### 5. 撰寫 Conventional Commit 訊息

使用：

```text
<type>(<optional-scope>): <imperative summary>

- <具體變更或目的>
- <另一項具體變更或必要影響>
```

- 常用 type：`feat`、`fix`、`refactor`、`test`、`docs`、`chore`、`build`、`ci`、`perf`、`style`、`revert`。
- scope 只有在 repository 慣例或模組邊界明確時才加，不為了形式硬造 scope。
- summary 聚焦「改變了什麼」，簡潔、具體，不使用句號結尾。
- breaking change 使用 `!` 並在 body/footer 清楚說明。
- subject 與 body 之間保留一個空行，body 使用 `- ` 開頭的條列，不把所有內容擠成一段文字。
- 每個 body 至少有一項，通常以 2–4 項為宜；記錄實際做了什麼，以及從 diff 能確認的目的、影響或必要同步內容，不只是重述 subject。
- 單一目的 commit 使用平面條列；同一 commit 合理包含多個子項目時，先用分類標籤，再用縮排條列說明各分類內容。
- migration、相容性、環境變數、驗證結果或未完成事項只有在與本次異動直接相關且有證據時才寫入，不虛構執行過的測試或背景。
- body 應記錄語意與理由，不逐一抄寫已在 staging 清單列出的檔名；只有檔名本身有助理解時才提及。
- 若使用者指定語言或 repository 有一致慣例，沿用該語言；否則以 repository 近期 commits 的主要語言為準。
- 交付前重新掃描完整訊息，包括 subject、body 與 trailers，確保沒有任何 AI 工具協作、生成來源或共同作者歸因。

單一目的範例：

```text
feat(api): 建立登入驗證流程

- 新增登入服務與 JWT 簽發流程
- 加入帳密錯誤與輸入驗證的 API 測試
```

同一 commit 含多個相關子項目的分類範例：

```text
chore(repo): 建立 repository 指南與開發流程 skills

- Repository guidelines:
  - 補充專案結構、開發指令、測試與安全性規範
- Git commit advisor:
  - 定義異動分組、staging 建議與 commit 訊息格式
- Development problem recorder:
  - 統一問題紀錄、驗證證據與分類索引流程
```

### 6. 明確要求執行時

只有當使用者使用「請幫我 add／commit／提交」等明確動作語句時才執行：

1. 依確認的分組 stage 精確路徑，不使用涵蓋不明的 `git add .`。
2. 重新查看 staged diff，確認沒有夾帶其他異動、secret 或不應提交的檔案。
3. 以建議訊息建立 commit。
4. 回報 commit hash、實際納入檔案與尚未提交的異動。
5. 除非使用者另外明確要求，不 push。

若範圍存在會實質改變 commit 內容的歧義，停在建議階段並請使用者選擇，不以猜測代替授權。

## 回覆格式

沒有異動時，直接說明 worktree clean。只有一組時省略多餘的分組層級；有多組時依建議提交順序排列：

````markdown
## 異動判讀

簡述 staged／unstaged／untracked 現況及主要風險。

## 建議 commit 1：<目的>

建議納入：
- `path`: 納入理由

暫不納入：
- `path`: 拆分或待確認理由

建議 staging：
`git add -- <paths>`

建議訊息：

```text
type(scope): summary

- 具體變更或目的
- 另一項具體變更或必要影響
```

## 提交前提醒

列出需要人工確認、建議測試或可能含秘密資料的事項；沒有則省略。
````

最後明確說明目前「僅提供建議，尚未 stage 或 commit」，除非本次確實已依使用者要求執行。
