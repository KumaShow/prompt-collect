<script setup lang="ts">
// PROTOTYPE — 後台變體 B「單頁 tab + 抽屜表單」：SaaS 風。頂部 tab 切換資源，
// 新增/編輯從右側滑出 drawer，列表全程保持可見（脈絡不中斷）。
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

const tab = ref<'categories' | 'skills'>('categories')
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const categoryInput = ref<CategoryInput>(emptyCategoryInput())
const skillInput = ref<SkillInput>(emptySkillInput())
const drawerError = ref<string | null>(null)
const listError = ref<string | null>(null)

function switchTab(next: 'categories' | 'skills') {
  tab.value = next
  drawerOpen.value = false
  listError.value = null
}

function openCreate() {
  editingId.value = null
  categoryInput.value = emptyCategoryInput()
  skillInput.value = emptySkillInput()
  drawerError.value = null
  drawerOpen.value = true
}

function openEdit(id: string) {
  editingId.value = id
  if (tab.value === 'categories') {
    const target = props.store.categories.find((c) => c.id === id)
    if (!target) return
    categoryInput.value = toCategoryInput(target)
  } else {
    const target = props.store.skills.find((s) => s.id === id)
    if (!target) return
    skillInput.value = toSkillInput(target)
  }
  drawerError.value = null
  drawerOpen.value = true
}

function save() {
  if (tab.value === 'categories') {
    drawerError.value = editingId.value
      ? props.store.updateCategory(editingId.value, categoryInput.value)
      : props.store.createCategory(categoryInput.value)
  } else {
    drawerError.value = editingId.value
      ? props.store.updateSkill(editingId.value, skillInput.value)
      : props.store.createSkill(skillInput.value)
  }
  if (!drawerError.value) drawerOpen.value = false
}

function remove(id: string) {
  listError.value =
    tab.value === 'categories' ? props.store.deleteCategory(id) : props.store.deleteSkill(id)
}
</script>

<template>
  <div class="ab">
    <header class="ab-header">
      <h1 class="ab-brand">Prompt 收藏庫 <span class="ab-badge">後台</span></h1>
      <div class="ab-tabs">
        <button
          type="button"
          class="ab-tab"
          :class="{ active: tab === 'categories' }"
          @click="switchTab('categories')"
        >
          類別（{{ store.categories.length }}）
        </button>
        <button
          type="button"
          class="ab-tab"
          :class="{ active: tab === 'skills' }"
          @click="switchTab('skills')"
        >
          Prompt / Skill（{{ store.skills.length }}）
        </button>
      </div>
      <button type="button" class="ab-btn ab-btn-primary" @click="openCreate">＋ 新增</button>
    </header>

    <main class="ab-main">
      <p v-if="listError" class="ab-error">⚠ {{ listError }}</p>

      <div v-if="tab === 'categories'" class="ab-cards">
        <div v-for="c in store.categories" :key="c.id" class="ab-card">
          <div class="ab-card-body">
            <p class="ab-card-title">{{ c.name }}</p>
            <p class="ab-card-sub">{{ c.description ?? '（無說明）' }}</p>
          </div>
          <span class="ab-pill">{{ store.skillCount(c.id) }} 筆資料</span>
          <div class="ab-card-actions">
            <button type="button" class="ab-btn" @click="openEdit(c.id)">編輯</button>
            <button type="button" class="ab-btn ab-btn-danger" @click="remove(c.id)">刪除</button>
          </div>
        </div>
      </div>

      <div v-else class="ab-cards">
        <div v-for="s in store.skills" :key="s.id" class="ab-card">
          <div class="ab-card-body">
            <p class="ab-card-title">{{ s.title }}</p>
            <p class="ab-card-sub">
              {{ store.categoryName(s.categoryId) }}
              <template v-if="s.tags.length"> ・ {{ s.tags.map((t) => `#${t}`).join(' ') }}</template>
            </p>
          </div>
          <div class="ab-card-actions">
            <button type="button" class="ab-btn" @click="openEdit(s.id)">編輯</button>
            <button type="button" class="ab-btn ab-btn-danger" @click="remove(s.id)">刪除</button>
          </div>
        </div>
      </div>
    </main>

    <!-- 抽屜表單 -->
    <div v-if="drawerOpen" class="ab-scrim" @click="drawerOpen = false"></div>
    <aside class="ab-drawer" :class="{ open: drawerOpen }">
      <div class="ab-drawer-head">
        <h2 class="ab-drawer-title">
          {{ editingId ? '編輯' : '新增' }}{{ tab === 'categories' ? '類別' : ' Prompt / Skill' }}
        </h2>
        <button type="button" class="ab-close" @click="drawerOpen = false">✕</button>
      </div>
      <p v-if="drawerError" class="ab-error">⚠ {{ drawerError }}</p>

      <form class="ab-form" @submit.prevent="save">
        <template v-if="tab === 'categories'">
          <label class="ab-field">
            <span>名稱 *</span>
            <input v-model="categoryInput.name" type="text" />
          </label>
          <label class="ab-field">
            <span>說明</span>
            <input v-model="categoryInput.description" type="text" placeholder="選填" />
          </label>
        </template>
        <template v-else>
          <label class="ab-field">
            <span>標題 *</span>
            <input v-model="skillInput.title" type="text" />
          </label>
          <label class="ab-field">
            <span>所屬類別 *</span>
            <select v-model="skillInput.categoryId">
              <option value="" disabled>請選擇</option>
              <option v-for="c in store.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </label>
          <label class="ab-field">
            <span>標籤（逗號分隔）</span>
            <input v-model="skillInput.tags" type="text" />
          </label>
          <label class="ab-field">
            <span>內容 *</span>
            <textarea v-model="skillInput.content" rows="7"></textarea>
          </label>
          <label class="ab-field">
            <span>適用情境</span>
            <input v-model="skillInput.useCase" type="text" placeholder="選填" />
          </label>
          <label class="ab-field">
            <span>範例輸入</span>
            <textarea v-model="skillInput.exampleInput" rows="3" placeholder="選填"></textarea>
          </label>
        </template>
        <div class="ab-form-actions">
          <button type="submit" class="ab-btn ab-btn-primary">儲存</button>
          <button type="button" class="ab-btn" @click="drawerOpen = false">取消</button>
        </div>
      </form>
    </aside>
  </div>
</template>

<style scoped>
.ab {
  min-height: 100%;
  background: #fafafa;
  color: #18181b;
  font-family: system-ui, sans-serif;
}
.ab-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 24px;
  background: #fff;
  border-bottom: 1px solid #e4e4e7;
  padding: 12px 28px;
}
.ab-brand {
  font-size: 16px;
  margin: 0;
  white-space: nowrap;
}
.ab-badge {
  font-size: 11px;
  background: #4f46e5;
  color: #fff;
  border-radius: 6px;
  padding: 2px 8px;
  vertical-align: middle;
  margin-left: 4px;
}
.ab-tabs {
  display: flex;
  gap: 4px;
  flex: 1;
}
.ab-tab {
  border: 0;
  background: none;
  padding: 8px 16px;
  font-size: 14px;
  color: #71717a;
  cursor: pointer;
  border-radius: 8px;
}
.ab-tab:hover {
  background: #f4f4f5;
}
.ab-tab.active {
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 600;
}
.ab-main {
  max-width: 860px;
  margin: 0 auto;
  padding: 24px 28px 100px;
}
.ab-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  margin: 0 0 14px;
}
.ab-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ab-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  padding: 14px 18px;
}
.ab-card-body {
  flex: 1;
  min-width: 0;
}
.ab-card-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 2px;
}
.ab-card-sub {
  font-size: 13px;
  color: #71717a;
  margin: 0;
}
.ab-pill {
  font-size: 12px;
  background: #f4f4f5;
  color: #52525b;
  border-radius: 999px;
  padding: 4px 10px;
  white-space: nowrap;
}
.ab-card-actions {
  display: flex;
  gap: 6px;
}
.ab-btn {
  border: 1px solid #d4d4d8;
  background: #fff;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.ab-btn:hover {
  background: #f4f4f5;
}
.ab-btn-primary {
  background: #4f46e5;
  border-color: #4f46e5;
  color: #fff;
}
.ab-btn-primary:hover {
  background: #4338ca;
}
.ab-btn-danger {
  color: #b91c1c;
  border-color: #fecaca;
}
.ab-btn-danger:hover {
  background: #fef2f2;
}
.ab-scrim {
  position: fixed;
  inset: 0;
  background: rgba(24, 24, 27, 0.35);
  z-index: 20;
}
.ab-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(420px, 92vw);
  background: #fff;
  box-shadow: -8px 0 30px rgba(0, 0, 0, 0.12);
  z-index: 21;
  padding: 20px 24px;
  overflow-y: auto;
  transform: translateX(100%);
  transition: transform 0.2s ease;
}
.ab-drawer.open {
  transform: translateX(0);
}
.ab-drawer-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.ab-drawer-title {
  font-size: 17px;
  margin: 0;
}
.ab-close {
  border: 0;
  background: none;
  font-size: 16px;
  cursor: pointer;
  color: #71717a;
}
.ab-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ab-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #52525b;
}
.ab-field input,
.ab-field select,
.ab-field textarea {
  border: 1px solid #d4d4d8;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-family: inherit;
}
.ab-form-actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}
</style>
