// PROTOTYPE — 後台管理的記憶體 store（丟棄式，不打 API、不落地）。
// 欄位對齊 apps/api 的 Entity 定案；驗證規則模擬 api-spec / PRD 第十四節：
// 名稱/標題/內容空白 → 400、類別名稱 unique、刪除有子資料的類別 → FK RESTRICT 阻擋。
import { reactive } from 'vue'

export interface AdminCategory {
  id: string
  name: string
  description: string | null
}

export interface AdminSkill {
  id: string
  title: string
  categoryId: string
  tags: string[]
  content: string
  useCase: string | null
  exampleInput: string | null
}

export interface CategoryInput {
  name: string
  description: string
}

export interface SkillInput {
  title: string
  categoryId: string
  tags: string // 逗號分隔，store 內解析
  content: string
  useCase: string
  exampleInput: string
}

let nextId = 1
const uid = (prefix: string) => `${prefix}-proto-${nextId++}`

export function createAdminStore() {
  const store = reactive({
    categories: [
      { id: 'cat-dev', name: '開發輔助', description: '寫程式、review、除錯相關' },
      { id: 'cat-writing', name: '寫作與文案', description: '文件、簡報、README' },
      { id: 'cat-learning', name: '學習方法', description: null },
    ] as AdminCategory[],

    skills: [
      {
        id: 'sk-01',
        title: 'Code Review 檢查清單',
        categoryId: 'cat-dev',
        tags: ['code-review', 'quality'],
        content:
          '請以資深工程師的角度 review 以下程式碼，依序檢查命名、邊界條件、效能、安全性，每個問題附具體修改建議。\n\n{貼上程式碼}',
        useCase: '發 PR 前自我檢查。',
        exampleInput: null,
      },
      {
        id: 'sk-02',
        title: 'Commit message 產生器',
        categoryId: 'cat-dev',
        tags: ['git', 'conventional-commits'],
        content:
          '根據以下 git diff 產生符合 Conventional Commits 的訊息，subject 繁中不超過 50 字。\n\n{貼上 git diff}',
        useCase: '每次 commit 前。',
        exampleInput: 'diff --git a/src/app.ts b/src/app.ts …',
      },
      {
        id: 'sk-07',
        title: 'README 快速草稿',
        categoryId: 'cat-writing',
        tags: ['readme', 'documentation'],
        content: '根據以下專案資訊產生 README 草稿，必含安裝步驟、環境變數、測試帳號與操作流程。',
        useCase: '專案收尾階段補文件。',
        exampleInput: null,
      },
      {
        id: 'sk-06',
        title: '費曼學習法陪練',
        categoryId: 'cat-learning',
        tags: ['feynman'],
        content: '我用自己的話解釋一個技術概念，請扮演不懂程式的聰明人追問我講不清楚的地方。',
        useCase: null,
        exampleInput: null,
      },
    ] as AdminSkill[],

    skillCount(categoryId: string): number {
      return store.skills.filter((s) => s.categoryId === categoryId).length
    },

    categoryName(id: string): string {
      return store.categories.find((c) => c.id === id)?.name ?? '未分類'
    },

    // ---- Category CRUD（回傳 null = 成功，字串 = 錯誤訊息，模擬後端回應）----

    validateCategory(input: CategoryInput, selfId?: string): string | null {
      const name = input.name.trim()
      if (!name) return '類別名稱不可空白（後端將回 400）'
      if (name.length > 50) return '類別名稱上限 50 字（varchar(50)）'
      if (store.categories.some((c) => c.name === name && c.id !== selfId))
        return `類別「${name}」已存在（name 有 unique 約束）`
      return null
    },

    createCategory(input: CategoryInput): string | null {
      const error = store.validateCategory(input)
      if (error) return error
      store.categories.push({
        id: uid('cat'),
        name: input.name.trim(),
        description: input.description.trim() || null,
      })
      logState('createCategory')
      return null
    },

    updateCategory(id: string, input: CategoryInput): string | null {
      const target = store.categories.find((c) => c.id === id)
      if (!target) return '找不到這個類別（404）'
      const error = store.validateCategory(input, id)
      if (error) return error
      target.name = input.name.trim()
      target.description = input.description.trim() || null
      logState(`updateCategory(${id})`)
      return null
    },

    deleteCategory(id: string): string | null {
      const count = store.skillCount(id)
      if (count > 0)
        return `此類別底下還有 ${count} 筆資料，不能刪除（FK RESTRICT，PRD 第十五節）`
      const index = store.categories.findIndex((c) => c.id === id)
      if (index === -1) return '找不到這個類別（404）'
      store.categories.splice(index, 1)
      logState(`deleteCategory(${id})`)
      return null
    },

    // ---- Skill CRUD ----

    validateSkill(input: SkillInput): string | null {
      if (!input.title.trim()) return '標題不可空白（後端將回 400）'
      if (input.title.trim().length > 100) return '標題上限 100 字（varchar(100)）'
      if (!input.categoryId) return '必須選擇所屬類別'
      if (!input.content.trim()) return '內容不可空白（後端將回 400）'
      return null
    },

    parseTags(raw: string): string[] {
      return raw
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean)
    },

    createSkill(input: SkillInput): string | null {
      const error = store.validateSkill(input)
      if (error) return error
      store.skills.unshift({
        id: uid('sk'),
        title: input.title.trim(),
        categoryId: input.categoryId,
        tags: store.parseTags(input.tags),
        content: input.content,
        useCase: input.useCase.trim() || null,
        exampleInput: input.exampleInput.trim() || null,
      })
      logState('createSkill')
      return null
    },

    updateSkill(id: string, input: SkillInput): string | null {
      const target = store.skills.find((s) => s.id === id)
      if (!target) return '找不到這筆資料（404）'
      const error = store.validateSkill(input)
      if (error) return error
      target.title = input.title.trim()
      target.categoryId = input.categoryId
      target.tags = store.parseTags(input.tags)
      target.content = input.content
      target.useCase = input.useCase.trim() || null
      target.exampleInput = input.exampleInput.trim() || null
      logState(`updateSkill(${id})`)
      return null
    },

    deleteSkill(id: string): string | null {
      const index = store.skills.findIndex((s) => s.id === id)
      if (index === -1) return '找不到這筆資料（404）'
      store.skills.splice(index, 1)
      logState(`deleteSkill(${id})`)
      return null
    },
  })

  function logState(action: string) {
    console.log(`[prototype/admin] ${action}`, {
      categories: store.categories.map((c) => `${c.name}(${store.skillCount(c.id)})`),
      skills: store.skills.map((s) => s.title),
    })
  }

  return store
}

export type AdminStore = ReturnType<typeof createAdminStore>

export function toSkillInput(skill: AdminSkill): SkillInput {
  return {
    title: skill.title,
    categoryId: skill.categoryId,
    tags: skill.tags.join(', '),
    content: skill.content,
    useCase: skill.useCase ?? '',
    exampleInput: skill.exampleInput ?? '',
  }
}

export function emptySkillInput(): SkillInput {
  return { title: '', categoryId: '', tags: '', content: '', useCase: '', exampleInput: '' }
}

export function emptyCategoryInput(): CategoryInput {
  return { name: '', description: '' }
}

export function toCategoryInput(category: AdminCategory): CategoryInput {
  return { name: category.name, description: category.description ?? '' }
}
