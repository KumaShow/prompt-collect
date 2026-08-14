<script setup lang="ts">
// PROTOTYPE — 後台變體 A「側欄分頁式」：傳統 admin。左側欄切換資源，
// 新增/編輯是獨立表單頁（取代列表畫面），儲存/取消後回列表。
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

const section = ref<'categories' | 'skills'>('categories')
const mode = ref<'list' | 'form'>('list')
const editingId = ref<string | null>(null)
const categoryInput = ref<CategoryInput>(emptyCategoryInput())
const skillInput = ref<SkillInput>(emptySkillInput())
const error = ref<string | null>(null)

function switchSection(next: 'categories' | 'skills') {
  section.value = next
  mode.value = 'list'
  error.value = null
}

function openCreate() {
  editingId.value = null
  categoryInput.value = emptyCategoryInput()
  skillInput.value = emptySkillInput()
  error.value = null
  mode.value = 'form'
}

function openEditCategory(id: string) {
  const target = props.store.categories.find((c) => c.id === id)
  if (!target) return
  editingId.value = id
  categoryInput.value = toCategoryInput(target)
  error.value = null
  mode.value = 'form'
}

function openEditSkill(id: string) {
  const target = props.store.skills.find((s) => s.id === id)
  if (!target) return
  editingId.value = id
  skillInput.value = toSkillInput(target)
  error.value = null
  mode.value = 'form'
}

function save() {
  if (section.value === 'categories') {
    error.value = editingId.value
      ? props.store.updateCategory(editingId.value, categoryInput.value)
      : props.store.createCategory(categoryInput.value)
  } else {
    error.value = editingId.value
      ? props.store.updateSkill(editingId.value, skillInput.value)
      : props.store.createSkill(skillInput.value)
  }
  if (!error.value) mode.value = 'list'
}

function remove(id: string) {
  error.value =
    section.value === 'categories' ? props.store.deleteCategory(id) : props.store.deleteSkill(id)
}
</script>

<template>
  <div class="aa">
    <aside class="aa-sidebar">
      <h1 class="aa-brand">後台管理</h1>
      <nav class="aa-nav">
        <button
          type="button"
          class="aa-nav-item"
          :class="{ active: section === 'categories' }"
          @click="switchSection('categories')"
        >
          類別管理 <span class="aa-count">{{ store.categories.length }}</span>
        </button>
        <button
          type="button"
          class="aa-nav-item"
          :class="{ active: section === 'skills' }"
          @click="switchSection('skills')"
        >
          Prompt / Skill 管理 <span class="aa-count">{{ store.skills.length }}</span>
        </button>
      </nav>
      <p class="aa-footer">admin@example.com（裝飾）</p>
    </aside>

    <main class="aa-main">
      <p v-if="error" class="aa-error">⚠ {{ error }}</p>

      <!-- 列表模式 -->
      <template v-if="mode === 'list'">
        <div class="aa-toolbar">
          <h2 class="aa-title">
            {{ section === 'categories' ? '類別管理' : 'Prompt / Skill 管理' }}
          </h2>
          <button type="button" class="aa-btn aa-btn-primary" @click="openCreate">
            ＋ 新增{{ section === 'categories' ? '類別' : '資料' }}
          </button>
        </div>

        <table v-if="section === 'categories'" class="aa-table">
          <thead>
            <tr>
              <th>名稱</th>
              <th>說明</th>
              <th class="num">資料數</th>
              <th class="actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in store.categories" :key="c.id">
              <td class="strong">{{ c.name }}</td>
              <td class="muted">{{ c.description ?? '—' }}</td>
              <td class="num">{{ store.skillCount(c.id) }}</td>
              <td class="actions">
                <button type="button" class="aa-btn" @click="openEditCategory(c.id)">編輯</button>
                <button type="button" class="aa-btn aa-btn-danger" @click="remove(c.id)">
                  刪除
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <table v-else class="aa-table">
          <thead>
            <tr>
              <th>標題</th>
              <th>類別</th>
              <th>標籤</th>
              <th class="actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in store.skills" :key="s.id">
              <td class="strong">{{ s.title }}</td>
              <td>{{ store.categoryName(s.categoryId) }}</td>
              <td class="muted">{{ s.tags.join(', ') || '—' }}</td>
              <td class="actions">
                <button type="button" class="aa-btn" @click="openEditSkill(s.id)">編輯</button>
                <button type="button" class="aa-btn aa-btn-danger" @click="remove(s.id)">
                  刪除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </template>

      <!-- 表單模式（獨立頁） -->
      <template v-else>
        <div class="aa-toolbar">
          <h2 class="aa-title">
            {{ editingId ? '編輯' : '新增' }}{{ section === 'categories' ? '類別' : '資料' }}
          </h2>
        </div>

        <form class="aa-form" @submit.prevent="save">
          <template v-if="section === 'categories'">
            <label class="aa-field">
              <span>名稱 *</span>
              <input v-model="categoryInput.name" type="text" placeholder="例如：開發輔助" />
            </label>
            <label class="aa-field">
              <span>說明</span>
              <input v-model="categoryInput.description" type="text" placeholder="選填" />
            </label>
          </template>
          <template v-else>
            <label class="aa-field">
              <span>標題 *</span>
              <input v-model="skillInput.title" type="text" />
            </label>
            <label class="aa-field">
              <span>所屬類別 *</span>
              <select v-model="skillInput.categoryId">
                <option value="" disabled>請選擇</option>
                <option v-for="c in store.categories" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
            </label>
            <label class="aa-field">
              <span>標籤（逗號分隔）</span>
              <input v-model="skillInput.tags" type="text" placeholder="git, code-review" />
            </label>
            <label class="aa-field">
              <span>內容 *</span>
              <textarea v-model="skillInput.content" rows="6"></textarea>
            </label>
            <label class="aa-field">
              <span>適用情境</span>
              <input v-model="skillInput.useCase" type="text" placeholder="選填" />
            </label>
            <label class="aa-field">
              <span>範例輸入</span>
              <textarea v-model="skillInput.exampleInput" rows="3" placeholder="選填"></textarea>
            </label>
          </template>

          <div class="aa-form-actions">
            <button type="submit" class="aa-btn aa-btn-primary">儲存</button>
            <button type="button" class="aa-btn" @click="((mode = 'list'), (error = null))">
              取消
            </button>
          </div>
        </form>
      </template>
    </main>
  </div>
</template>

<style scoped>
.aa {
  display: flex;
  min-height: 100%;
  background: #f5f5f4;
  color: #292524;
  font-family: system-ui, sans-serif;
}
.aa-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #292524;
  color: #d6d3d1;
  padding: 24px 14px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 0;
  height: 100vh;
  box-sizing: border-box;
}
.aa-brand {
  font-size: 18px;
  margin: 0;
  color: #fff;
  padding: 0 8px;
}
.aa-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.aa-nav-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: #d6d3d1;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
}
.aa-nav-item:hover {
  background: #44403c;
}
.aa-nav-item.active {
  background: #d97706;
  color: #fff;
}
.aa-count {
  font-size: 12px;
  opacity: 0.7;
}
.aa-footer {
  margin-top: auto;
  font-size: 12px;
  color: #78716c;
  padding: 0 8px;
}
.aa-main {
  flex: 1;
  padding: 28px 36px 100px;
  max-width: 960px;
}
.aa-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  margin: 0 0 16px;
}
.aa-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.aa-title {
  font-size: 20px;
  margin: 0;
}
.aa-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border: 1px solid #e7e5e4;
  border-radius: 10px;
  overflow: hidden;
}
.aa-table th {
  text-align: left;
  font-size: 12px;
  color: #78716c;
  font-weight: 600;
  padding: 10px 14px;
  background: #fafaf9;
  border-bottom: 1px solid #e7e5e4;
}
.aa-table td {
  padding: 12px 14px;
  font-size: 14px;
  border-bottom: 1px solid #f5f5f4;
}
.aa-table .strong {
  font-weight: 600;
}
.aa-table .muted {
  color: #78716c;
}
.aa-table .num {
  text-align: right;
  width: 70px;
}
.aa-table .actions {
  text-align: right;
  white-space: nowrap;
  width: 140px;
}
.aa-btn {
  border: 1px solid #d6d3d1;
  background: #fff;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  margin-left: 6px;
}
.aa-btn:hover {
  background: #f5f5f4;
}
.aa-btn-primary {
  background: #d97706;
  border-color: #d97706;
  color: #fff;
}
.aa-btn-primary:hover {
  background: #b45309;
}
.aa-btn-danger {
  color: #b91c1c;
  border-color: #fecaca;
}
.aa-btn-danger:hover {
  background: #fef2f2;
}
.aa-form {
  background: #fff;
  border: 1px solid #e7e5e4;
  border-radius: 10px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 560px;
}
.aa-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #57534e;
}
.aa-field input,
.aa-field select,
.aa-field textarea {
  border: 1px solid #d6d3d1;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-family: inherit;
}
.aa-form-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
.aa-form-actions .aa-btn {
  margin-left: 0;
}
</style>
