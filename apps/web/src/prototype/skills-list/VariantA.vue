<script setup lang="ts">
// PROTOTYPE — 變體 A「卡片牆」：視覺瀏覽為主。頂部工具列（搜尋 + 類別 chips），下方響應式卡片格。
// 定案補充（2026-08-14）：點擊卡片展開全文（展開時卡片橫跨整列），互動借自變體 B。
import { ref } from 'vue'
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

function categoryName(id: string) {
  return props.categories.find((c) => c.id === id)?.name ?? '未分類'
}

const expandedId = ref<string | null>(null)

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}
</script>

<template>
  <div class="va">
    <header class="va-toolbar">
      <div class="va-toolbar-inner">
        <h1 class="va-brand">Prompt 收藏庫</h1>
        <input
          class="va-search"
          type="search"
          placeholder="搜尋標題、內容、標籤…"
          :value="keyword"
          @input="emit('update:keyword', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="va-chips">
        <button
          type="button"
          class="va-chip"
          :class="{ active: selectedCategoryId === null }"
          @click="emit('update:selectedCategoryId', null)"
        >
          全部
        </button>
        <button
          v-for="c in categories"
          :key="c.id"
          type="button"
          class="va-chip"
          :class="{ active: selectedCategoryId === c.id }"
          @click="emit('update:selectedCategoryId', c.id)"
        >
          {{ c.name }} <span class="va-chip-count">{{ categoryCounts[c.id] ?? 0 }}</span>
        </button>
      </div>
    </header>

    <main class="va-main">
      <p v-if="items.length === 0" class="va-empty">找不到符合的 Prompt / Skill，換個關鍵字試試。</p>
      <div class="va-grid">
        <article
          v-for="item in items"
          :key="item.id"
          class="va-card"
          :class="{ expanded: expandedId === item.id }"
          @click="toggleExpand(item.id)"
        >
          <div class="va-card-head">
            <span class="va-badge">{{ categoryName(item.categoryId) }}</span>
            <button
              type="button"
              class="va-heart"
              :class="{ on: favoriteIds.has(item.id) }"
              :aria-label="favoriteIds.has(item.id) ? '取消收藏' : '收藏'"
              @click.stop="emit('toggleFavorite', item.id)"
            >
              {{ favoriteIds.has(item.id) ? '♥' : '♡' }}
            </button>
          </div>
          <h2 class="va-title">{{ item.title }}</h2>
          <pre v-if="expandedId === item.id" class="va-content-full" @click.stop>{{
            item.content
          }}</pre>
          <p v-else class="va-content">{{ item.content }}</p>
          <p v-if="item.useCase" class="va-usecase">適用：{{ item.useCase }}</p>
          <div class="va-card-foot">
            <div class="va-tags">
              <span v-for="tag in item.tags" :key="tag" class="va-tag">#{{ tag }}</span>
            </div>
            <span class="va-expand-hint">{{ expandedId === item.id ? '收合 ▴' : '展開 ▾' }}</span>
            <button type="button" class="va-copy" @click.stop="emit('copy', item)">
              {{ copiedId === item.id ? '已複製 ✓' : '複製' }}
            </button>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>

<style scoped>
.va {
  min-height: 100%;
  background: #faf7f2;
  color: #2b2620;
  font-family: system-ui, sans-serif;
}
.va-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fffdf9;
  border-bottom: 1px solid #e8e1d5;
  padding: 14px 24px 10px;
}
.va-toolbar-inner {
  display: flex;
  align-items: center;
  gap: 20px;
  max-width: 1100px;
  margin: 0 auto;
}
.va-brand {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  white-space: nowrap;
}
.va-search {
  flex: 1;
  max-width: 420px;
  padding: 9px 14px;
  border: 1px solid #d8cfbe;
  border-radius: 10px;
  background: #fff;
  font-size: 14px;
}
.va-chips {
  display: flex;
  gap: 8px;
  max-width: 1100px;
  margin: 12px auto 0;
  flex-wrap: wrap;
}
.va-chip {
  border: 1px solid #d8cfbe;
  background: #fff;
  border-radius: 999px;
  padding: 5px 14px;
  font-size: 13px;
  cursor: pointer;
  color: #6b6252;
}
.va-chip.active {
  background: #2b2620;
  border-color: #2b2620;
  color: #fff;
}
.va-chip-count {
  opacity: 0.6;
  margin-left: 2px;
}
.va-main {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 24px 100px;
}
.va-empty {
  text-align: center;
  color: #8a7f6c;
  padding: 60px 0;
}
.va-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;
}
.va-card {
  background: #fff;
  border: 1px solid #ece5d8;
  border-radius: 14px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 1px 3px rgba(43, 38, 32, 0.05);
  cursor: pointer;
}
.va-card:hover {
  border-color: #d8cfbe;
}
.va-card.expanded {
  grid-column: 1 / -1;
  border-color: #c4b389;
  box-shadow: 0 4px 16px rgba(43, 38, 32, 0.1);
}
.va-content-full {
  font-size: 13px;
  color: #4a4438;
  background: #f7f2e9;
  border-radius: 8px;
  padding: 14px;
  margin: 0;
  white-space: pre-wrap;
  font-family: ui-monospace, monospace;
  line-height: 1.6;
  cursor: text;
}
.va-expand-hint {
  font-size: 12px;
  color: #b0a48c;
  margin-left: auto;
}
.va-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.va-badge {
  font-size: 12px;
  background: #f0e9dc;
  color: #7a6a4d;
  border-radius: 6px;
  padding: 3px 8px;
}
.va-heart {
  border: 0;
  background: none;
  font-size: 20px;
  cursor: pointer;
  color: #c9beab;
  line-height: 1;
}
.va-heart.on {
  color: #e2556f;
}
.va-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}
.va-content {
  font-size: 13px;
  color: #6b6252;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: pre-line;
}
.va-usecase {
  font-size: 12px;
  color: #a08d6c;
  margin: 0;
}
.va-card-foot {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.va-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.va-tag {
  font-size: 12px;
  color: #9a8d75;
}
.va-copy {
  border: 1px solid #d8cfbe;
  background: #fff;
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.va-copy:hover {
  background: #f5efe4;
}
</style>
