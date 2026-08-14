<script setup lang="ts">
// PROTOTYPE — 後台變體 C「就地編輯表格」：Airtable/Notion 感。兩個資源同一頁上下排列，
// 沒有獨立表單頁 —— 類別點了直接在列上改，Prompt/Skill 點列展開行內表單，新增列就長在表格裡。
import { ref } from 'vue'
import {
  emptyCategoryInput,
  emptySkillInput,
  toCategoryInput,
  toSkillInput,
  type AdminStore,
  type CategoryInput,
  type SkillInput,
} from './store'

const props = defineProps<{ store: AdminStore }>()

// ---- 類別：行內編輯 ----
const editingCatId = ref<string | null>(null)
const catDraft = ref<CategoryInput>(emptyCategoryInput())
const newCat = ref<CategoryInput>(emptyCategoryInput())
const catError = ref<string | null>(null)

function startEditCategory(id: string) {
  const target = props.store.categories.find((c) => c.id === id)
  if (!target) return
  editingCatId.value = id
  catDraft.value = toCategoryInput(target)
  catError.value = null
}

function saveCategory() {
  if (!editingCatId.value) return
  catError.value = props.store.updateCategory(editingCatId.value, catDraft.value)
  if (!catError.value) editingCatId.value = null
}

function addCategory() {
  catError.value = props.store.createCategory(newCat.value)
  if (!catError.value) newCat.value = emptyCategoryInput()
}

function removeCategory(id: string) {
  catError.value = props.store.deleteCategory(id)
}

// ---- Prompt / Skill：點列展開行內表單 ----
const expandedSkillId = ref<string | null>(null) // 'NEW' = 新增列
const skillDraft = ref<SkillInput>(emptySkillInput())
const skillError = ref<string | null>(null)

function toggleSkill(id: string) {
  if (expandedSkillId.value === id) {
    expandedSkillId.value = null
    return
  }
  const target = props.store.skills.find((s) => s.id === id)
  if (!target) return
  expandedSkillId.value = id
  skillDraft.value = toSkillInput(target)
  skillError.value = null
}

function startNewSkill() {
  expandedSkillId.value = expandedSkillId.value === 'NEW' ? null : 'NEW'
  skillDraft.value = emptySkillInput()
  skillError.value = null
}

function saveSkill() {
  skillError.value =
    expandedSkillId.value === 'NEW'
      ? props.store.createSkill(skillDraft.value)
      : expandedSkillId.value
        ? props.store.updateSkill(expandedSkillId.value, skillDraft.value)
        : null
  if (!skillError.value) expandedSkillId.value = null
}

function removeSkill(id: string) {
  skillError.value = props.store.deleteSkill(id)
  if (expandedSkillId.value === id) expandedSkillId.value = null
}
</script>

<template>
  <div class="ac">
    <header class="ac-header">
      <h1 class="ac-brand">後台總表</h1>
      <p class="ac-hint">點任何一列直接就地編輯，改完儲存，不換頁。</p>
    </header>

    <main class="ac-main">
      <!-- 類別區 -->
      <section class="ac-section">
        <h2 class="ac-section-title">類別 <span class="ac-dim">{{ store.categories.length }}</span></h2>
        <p v-if="catError" class="ac-error">⚠ {{ catError }}</p>

        <div class="ac-table">
          <div class="ac-thead">
            <span class="col-name">名稱</span>
            <span class="col-desc">說明</span>
            <span class="col-count">資料數</span>
            <span class="col-act"></span>
          </div>

          <template v-for="c in store.categories" :key="c.id">
            <div v-if="editingCatId === c.id" class="ac-row editing">
              <input
                v-model="catDraft.name"
                class="col-name ac-input"
                type="text"
                @keyup.enter="saveCategory"
              />
              <input
                v-model="catDraft.description"
                class="col-desc ac-input"
                type="text"
                placeholder="選填"
                @keyup.enter="saveCategory"
              />
              <span class="col-count ac-dim">{{ store.skillCount(c.id) }}</span>
              <span class="col-act">
                <button type="button" class="ac-btn ac-btn-primary" @click="saveCategory">儲存</button>
                <button type="button" class="ac-btn" @click="editingCatId = null">取消</button>
              </span>
            </div>
            <div v-else class="ac-row" @click="startEditCategory(c.id)">
              <span class="col-name strong">{{ c.name }}</span>
              <span class="col-desc ac-dim">{{ c.description ?? '—' }}</span>
              <span class="col-count ac-dim">{{ store.skillCount(c.id) }}</span>
              <span class="col-act">
                <button type="button" class="ac-btn ac-btn-danger" @click.stop="removeCategory(c.id)">
                  刪除
                </button>
              </span>
            </div>
          </template>

          <!-- 行內新增列 -->
          <div class="ac-row ac-row-new">
            <input
              v-model="newCat.name"
              class="col-name ac-input"
              type="text"
              placeholder="＋ 新類別名稱"
              @keyup.enter="addCategory"
            />
            <input
              v-model="newCat.description"
              class="col-desc ac-input"
              type="text"
              placeholder="說明（選填）"
              @keyup.enter="addCategory"
            />
            <span class="col-count"></span>
            <span class="col-act">
              <button type="button" class="ac-btn ac-btn-primary" @click="addCategory">新增</button>
            </span>
          </div>
        </div>
      </section>

      <!-- Prompt / Skill 區 -->
      <section class="ac-section">
        <div class="ac-section-head">
          <h2 class="ac-section-title">
            Prompt / Skill <span class="ac-dim">{{ store.skills.length }}</span>
          </h2>
          <button type="button" class="ac-btn ac-btn-primary" @click="startNewSkill">
            {{ expandedSkillId === 'NEW' ? '收起新增列' : '＋ 新增' }}
          </button>
        </div>
        <p v-if="skillError" class="ac-error">⚠ {{ skillError }}</p>

        <div class="ac-table">
          <div class="ac-thead">
            <span class="col-title">標題</span>
            <span class="col-cat">類別</span>
            <span class="col-tags">標籤</span>
            <span class="col-act"></span>
          </div>

          <!-- 新增列（展開成行內表單） -->
          <div v-if="expandedSkillId === 'NEW'" class="ac-inline-form">
            <div class="ac-form-grid">
              <input v-model="skillDraft.title" class="ac-input" type="text" placeholder="標題 *" />
              <select v-model="skillDraft.categoryId" class="ac-input">
                <option value="" disabled>所屬類別 *</option>
                <option v-for="c in store.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
              <input
                v-model="skillDraft.tags"
                class="ac-input span2"
                type="text"
                placeholder="標籤（逗號分隔）"
              />
              <textarea
                v-model="skillDraft.content"
                class="ac-input span2"
                rows="5"
                placeholder="內容 *"
              ></textarea>
              <input
                v-model="skillDraft.useCase"
                class="ac-input"
                type="text"
                placeholder="適用情境（選填）"
              />
              <input
                v-model="skillDraft.exampleInput"
                class="ac-input"
                type="text"
                placeholder="範例輸入（選填）"
              />
            </div>
            <div class="ac-form-actions">
              <button type="button" class="ac-btn ac-btn-primary" @click="saveSkill">新增</button>
              <button type="button" class="ac-btn" @click="expandedSkillId = null">取消</button>
            </div>
          </div>

          <template v-for="s in store.skills" :key="s.id">
            <div class="ac-row" @click="toggleSkill(s.id)">
              <span class="col-title strong">{{ s.title }}</span>
              <span class="col-cat"
                ><span class="ac-chip">{{ store.categoryName(s.categoryId) }}</span></span
              >
              <span class="col-tags ac-dim">{{ s.tags.join(', ') || '—' }}</span>
              <span class="col-act">
                <button type="button" class="ac-btn ac-btn-danger" @click.stop="removeSkill(s.id)">
                  刪除
                </button>
              </span>
            </div>

            <!-- 展開的行內編輯表單 -->
            <div v-if="expandedSkillId === s.id" class="ac-inline-form">
              <div class="ac-form-grid">
                <input v-model="skillDraft.title" class="ac-input" type="text" placeholder="標題 *" />
                <select v-model="skillDraft.categoryId" class="ac-input">
                  <option value="" disabled>所屬類別 *</option>
                  <option v-for="c in store.categories" :key="c.id" :value="c.id">
                    {{ c.name }}
                  </option>
                </select>
                <input
                  v-model="skillDraft.tags"
                  class="ac-input span2"
                  type="text"
                  placeholder="標籤（逗號分隔）"
                />
                <textarea
                  v-model="skillDraft.content"
                  class="ac-input span2"
                  rows="5"
                  placeholder="內容 *"
                ></textarea>
                <input
                  v-model="skillDraft.useCase"
                  class="ac-input"
                  type="text"
                  placeholder="適用情境（選填）"
                />
                <input
                  v-model="skillDraft.exampleInput"
                  class="ac-input"
                  type="text"
                  placeholder="範例輸入（選填）"
                />
              </div>
              <div class="ac-form-actions">
                <button type="button" class="ac-btn ac-btn-primary" @click="saveSkill">儲存</button>
                <button type="button" class="ac-btn" @click="expandedSkillId = null">取消</button>
              </div>
            </div>
          </template>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.ac {
  min-height: 100%;
  background: #fcfcfd;
  color: #1f2328;
  font-family: system-ui, sans-serif;
}
.ac-header {
  padding: 24px 32px 0;
  max-width: 980px;
  margin: 0 auto;
}
.ac-brand {
  font-size: 22px;
  margin: 0 0 4px;
}
.ac-hint {
  font-size: 13px;
  color: #8b949e;
  margin: 0;
}
.ac-main {
  max-width: 980px;
  margin: 0 auto;
  padding: 20px 32px 100px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.ac-section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ac-section-title {
  font-size: 16px;
  margin: 0 0 10px;
}
.ac-dim {
  color: #8b949e;
  font-weight: 400;
}
.ac-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  margin: 0 0 10px;
}
.ac-table {
  border: 1px solid #e6e8eb;
  border-radius: 10px;
  background: #fff;
  overflow: hidden;
}
.ac-thead,
.ac-row {
  display: grid;
  grid-template-columns: 1.2fr 1.6fr 0.5fr 130px;
  gap: 12px;
  align-items: center;
  padding: 8px 14px;
}
.ac-thead {
  background: #f6f8fa;
  font-size: 12px;
  color: #8b949e;
  border-bottom: 1px solid #e6e8eb;
}
/* Skill 表格欄位比例 */
.ac-thead:has(.col-title),
.ac-row:has(.col-title) {
  grid-template-columns: 1.4fr 0.8fr 1.2fr 130px;
}
.ac-row {
  border-bottom: 1px solid #f0f2f4;
  font-size: 14px;
  cursor: pointer;
  min-height: 30px;
}
.ac-row:hover {
  background: #f9fafb;
}
.ac-row.editing,
.ac-row-new {
  cursor: default;
  background: #fbfdff;
}
.ac-row:last-child {
  border-bottom: 0;
}
.strong {
  font-weight: 600;
}
.ac-chip {
  font-size: 12px;
  background: #eef2f6;
  color: #57606a;
  border-radius: 6px;
  padding: 2px 8px;
}
.col-act {
  text-align: right;
  white-space: nowrap;
}
.ac-btn {
  border: 1px solid #d0d7de;
  background: #fff;
  border-radius: 7px;
  padding: 4px 12px;
  font-size: 12.5px;
  cursor: pointer;
  margin-left: 4px;
}
.ac-btn:hover {
  background: #f6f8fa;
}
.ac-btn-primary {
  background: #1f883d;
  border-color: #1f883d;
  color: #fff;
}
.ac-btn-primary:hover {
  background: #197335;
}
.ac-btn-danger {
  color: #cf222e;
  border-color: #ffcdd1;
}
.ac-btn-danger:hover {
  background: #fff5f5;
}
.ac-input {
  border: 1px solid #d0d7de;
  border-radius: 7px;
  padding: 6px 10px;
  font-size: 13.5px;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}
.ac-inline-form {
  padding: 14px 18px;
  background: #f6f8fa;
  border-bottom: 1px solid #e6e8eb;
}
.ac-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.ac-form-grid .span2 {
  grid-column: 1 / -1;
}
.ac-form-actions {
  margin-top: 10px;
  display: flex;
  gap: 6px;
}
.ac-form-actions .ac-btn {
  margin-left: 0;
}
</style>
