<script setup lang="ts">
// PROTOTYPE — 變體 C「搜尋優先」：大搜尋框 + 雙欄 master-detail，內容是主角（搜到就能整段讀、整段複製）。
import { computed, ref, watch } from 'vue'
import type { Category, SkillItem } from './data'

const props = defineProps<{
  categories: Category[]
  items: SkillItem[]
  categoryCounts: Record<string, number>
  keyword: string
  selectedCategoryId: string | null
  favoriteIds: Set<string>
  copiedId: string | null
}>()

const emit = defineEmits<{
  'update:keyword': [value: string]
  'update:selectedCategoryId': [value: string | null]
  toggleFavorite: [id: string]
  copy: [item: SkillItem]
}>()

const selectedId = ref<string | null>(props.items[0]?.id ?? null)

watch(
  () => props.items,
  (items) => {
    if (!items.some((i) => i.id === selectedId.value)) {
      selectedId.value = items[0]?.id ?? null
    }
  },
)

const selected = computed(() => props.items.find((i) => i.id === selectedId.value) ?? null)

function categoryName(id: string) {
  return props.categories.find((c) => c.id === id)?.name ?? '未分類'
}
</script>

<template>
  <div class="vc">
    <section class="vc-hero">
      <h1 class="vc-brand">要找什麼 Prompt？</h1>
      <input
        class="vc-search"
        type="search"
        placeholder="輸入關鍵字，例如 code review、README…"
        :value="keyword"
        @input="emit('update:keyword', ($event.target as HTMLInputElement).value)"
      />
      <div class="vc-filters">
        <button
          type="button"
          class="vc-filter"
          :class="{ active: selectedCategoryId === null }"
          @click="emit('update:selectedCategoryId', null)"
        >
          全部
        </button>
        <button
          v-for="c in categories"
          :key="c.id"
          type="button"
          class="vc-filter"
          :class="{ active: selectedCategoryId === c.id }"
          @click="emit('update:selectedCategoryId', c.id)"
        >
          {{ c.name }}
        </button>
      </div>
    </section>

    <section class="vc-body">
      <aside class="vc-results">
        <p class="vc-result-count">{{ items.length }} 筆結果</p>
        <p v-if="items.length === 0" class="vc-empty">沒有符合的結果。</p>
        <button
          v-for="item in items"
          :key="item.id"
          type="button"
          class="vc-result"
          :class="{ active: item.id === selectedId }"
          @click="selectedId = item.id"
        >
          <span class="vc-result-title">
            <span v-if="favoriteIds.has(item.id)" class="vc-result-fav">♥</span>
            {{ item.title }}
          </span>
          <span class="vc-result-cat">{{ categoryName(item.categoryId) }}</span>
        </button>
      </aside>

      <article v-if="selected" class="vc-detail">
        <div class="vc-detail-head">
          <div>
            <span class="vc-detail-cat">{{ categoryName(selected.categoryId) }}</span>
            <h2 class="vc-detail-title">{{ selected.title }}</h2>
            <div class="vc-detail-tags">
              <span v-for="tag in selected.tags" :key="tag">#{{ tag }}</span>
            </div>
          </div>
          <div class="vc-actions">
            <button type="button" class="vc-btn vc-btn-primary" @click="emit('copy', selected)">
              {{ copiedId === selected.id ? '已複製 ✓' : '一鍵複製' }}
            </button>
            <button
              type="button"
              class="vc-btn"
              :class="{ faved: favoriteIds.has(selected.id) }"
              @click="emit('toggleFavorite', selected.id)"
            >
              {{ favoriteIds.has(selected.id) ? '♥ 已收藏' : '♡ 收藏' }}
            </button>
          </div>
        </div>
        <p v-if="selected.useCase" class="vc-usecase">適用情境：{{ selected.useCase }}</p>
        <pre class="vc-content">{{ selected.content }}</pre>
      </article>
      <div v-else class="vc-detail vc-detail-empty">選一筆結果來閱讀內容</div>
    </section>
  </div>
</template>

<style scoped>
.vc {
  min-height: 100%;
  background: #0f1219;
  color: #e6e9f0;
  font-family: system-ui, sans-serif;
  display: flex;
  flex-direction: column;
}
.vc-hero {
  padding: 48px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.vc-brand {
  font-size: 24px;
  margin: 0;
  color: #fff;
}
.vc-search {
  width: min(560px, 90vw);
  padding: 14px 20px;
  border-radius: 14px;
  border: 1px solid #2c3345;
  background: #1a1f2c;
  color: #e6e9f0;
  font-size: 16px;
  outline: none;
}
.vc-search:focus {
  border-color: #5b7fff;
  box-shadow: 0 0 0 3px rgba(91, 127, 255, 0.25);
}
.vc-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
.vc-filter {
  border: 1px solid #2c3345;
  background: none;
  color: #9aa4b8;
  border-radius: 999px;
  padding: 5px 14px;
  font-size: 13px;
  cursor: pointer;
}
.vc-filter.active {
  background: #5b7fff;
  border-color: #5b7fff;
  color: #fff;
}
.vc-body {
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px 100px;
  box-sizing: border-box;
  align-items: start;
}
.vc-results {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.vc-result-count {
  font-size: 12px;
  color: #6b7488;
  margin: 0 0 4px;
}
.vc-empty {
  color: #6b7488;
  font-size: 14px;
}
.vc-result {
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: left;
  border: 1px solid transparent;
  background: #161b26;
  border-radius: 10px;
  padding: 10px 12px;
  cursor: pointer;
  color: inherit;
}
.vc-result:hover {
  background: #1d2432;
}
.vc-result.active {
  border-color: #5b7fff;
  background: #1d2432;
}
.vc-result-title {
  font-size: 14px;
  font-weight: 600;
  color: #e6e9f0;
}
.vc-result-fav {
  color: #ff7b9c;
  margin-right: 2px;
}
.vc-result-cat {
  font-size: 12px;
  color: #6b7488;
}
.vc-detail {
  background: #161b26;
  border: 1px solid #232a3a;
  border-radius: 14px;
  padding: 24px;
  position: sticky;
  top: 20px;
}
.vc-detail-empty {
  color: #6b7488;
  text-align: center;
  padding: 60px 0;
}
.vc-detail-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}
.vc-detail-cat {
  font-size: 12px;
  color: #8fa0ff;
}
.vc-detail-title {
  font-size: 20px;
  margin: 4px 0 8px;
  color: #fff;
}
.vc-detail-tags {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #6b7488;
}
.vc-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.vc-btn {
  border: 1px solid #2c3345;
  background: #1a1f2c;
  color: #e6e9f0;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.vc-btn:hover {
  background: #232a3a;
}
.vc-btn.faved {
  color: #ff7b9c;
  border-color: #ff7b9c55;
}
.vc-btn-primary {
  background: #5b7fff;
  border-color: #5b7fff;
  color: #fff;
}
.vc-btn-primary:hover {
  background: #4a6cf0;
}
.vc-usecase {
  font-size: 13px;
  color: #9aa4b8;
  margin: 14px 0;
}
.vc-content {
  background: #0f1219;
  border: 1px solid #232a3a;
  border-radius: 10px;
  padding: 16px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  font-family: ui-monospace, monospace;
  color: #c9d1e0;
  margin: 0;
}
@media (max-width: 760px) {
  .vc-body {
    grid-template-columns: 1fr;
  }
  .vc-detail {
    position: static;
  }
}
</style>
