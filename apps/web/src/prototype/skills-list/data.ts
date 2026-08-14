// PROTOTYPE — 丟棄式假資料，欄位形狀對齊 docs/design/data-model.md 的 SkillItem / Category。
// 不打 API、不落地，純記憶體。

export interface Category {
  id: string
  name: string
}

export interface SkillItem {
  id: string
  title: string
  categoryId: string
  tags: string[]
  content: string
  useCase?: string
}

export const categories: Category[] = [
  { id: 'cat-dev', name: '開發輔助' },
  { id: 'cat-writing', name: '寫作與文案' },
  { id: 'cat-learning', name: '學習方法' },
]

export const skillItems: SkillItem[] = [
  {
    id: 'sk-01',
    title: 'Code Review 檢查清單',
    categoryId: 'cat-dev',
    tags: ['code-review', 'quality'],
    content:
      '請以資深工程師的角度 review 以下程式碼，依序檢查：1) 命名與可讀性 2) 邊界條件與錯誤處理 3) 效能疑慮 4) 安全性問題。每個問題附上具體修改建議與範例程式碼。\n\n```\n{貼上程式碼}\n```',
    useCase: '發 PR 前自我檢查，或請 AI 當第二雙眼睛。',
  },
  {
    id: 'sk-02',
    title: 'Commit message 產生器',
    categoryId: 'cat-dev',
    tags: ['git', 'conventional-commits'],
    content:
      '根據以下 git diff 產生一則符合 Conventional Commits 規範的 commit message（type(scope): subject），subject 用繁體中文、不超過 50 字，必要時附 body 說明「為什麼」而非「做了什麼」。\n\n{貼上 git diff}',
    useCase: '每次 commit 前，讓訊息格式一致。',
  },
  {
    id: 'sk-03',
    title: 'SQL 查詢優化顧問',
    categoryId: 'cat-dev',
    tags: ['sql', 'performance', 'postgresql'],
    content:
      '這是我的 PostgreSQL 查詢與 EXPLAIN ANALYZE 結果，請指出：1) 目前的瓶頸在哪個節點 2) 是否需要索引、建在哪些欄位 3) 查詢本身可以怎麼改寫。請解釋原因，不要只給答案。',
    useCase: '查詢變慢、想學會看執行計畫的時候。',
  },
  {
    id: 'sk-04',
    title: 'API 錯誤訊息設計檢查',
    categoryId: 'cat-dev',
    tags: ['api-design', 'error-handling'],
    content:
      '檢查以下 API 錯誤回應設計：狀態碼是否語意正確（400/401/403/404/409/500）、錯誤訊息是否洩漏敏感資訊（例如帳號是否存在）、格式是否一致。以表格列出問題與建議。',
    useCase: '設計或 review 錯誤處理規格時。',
  },
  {
    id: 'sk-05',
    title: '技術文章摘要與重點提問',
    categoryId: 'cat-learning',
    tags: ['reading', 'summary'],
    content:
      '閱讀以下技術文章後：1) 用 5 點摘要核心內容 2) 列出 3 個作者假設但沒有明說的前提 3) 出 3 題檢驗我是否真的理解的問題（先不要給答案）。\n\n{貼上文章}',
    useCase: '讀完長文怕自己只是「看過」而非「懂了」。',
  },
  {
    id: 'sk-06',
    title: '費曼學習法陪練',
    categoryId: 'cat-learning',
    tags: ['feynman', 'active-recall'],
    content:
      '我會用自己的話解釋一個技術概念，請你扮演完全不懂程式的聰明人：1) 在我講得含糊的地方追問 2) 指出我用了行話但沒解釋的詞 3) 最後評分我的解釋哪裡最弱。概念是：{概念名稱}',
    useCase: '學新概念後檢驗自己是否真的理解。',
  },
  {
    id: 'sk-07',
    title: 'README 快速草稿',
    categoryId: 'cat-writing',
    tags: ['readme', 'documentation'],
    content:
      '根據以下專案資訊產生 README 草稿，必含：專案簡介、安裝步驟、環境變數說明、啟動指令、測試帳號、主要功能操作流程。語氣務實、不要行銷腔。\n\n專案資訊：{描述}',
    useCase: '專案收尾階段快速補文件。',
  },
  {
    id: 'sk-08',
    title: '成果發表大綱教練',
    categoryId: 'cat-writing',
    tags: ['presentation', 'storytelling'],
    content:
      '我要做 10 分鐘的專案成果發表，聽眾是同學與老師。根據以下專案重點，幫我排出敘事大綱：從問題出發 → 展示解法 → 技術取捨 → AI 協作中哪些是我自己的判斷。每段附一句開場白範例。',
    useCase: '準備 Demo Day 簡報時。',
  },
]
