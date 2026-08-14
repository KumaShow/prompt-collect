<script setup lang="ts">
// PROTOTYPE — 變體 B「側欄清單」：類別導覽為主。左側深色側欄（類別 + 計數），右側密集列表，點列展開全文。
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

const expandedId = ref<string | null>(null)

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function categoryName(id: string) {
  return props.categories.find((c) => c.id === id)?.name ?? '未分類'
}
</script>

<template>
  <div class="vb">
    <aside class="vb-sidebar">
      <h1 class="vb-brand">Prompt<br />收藏庫</h1>
      <nav class="vb-nav">
        <button
          type="button"
          class="vb-nav-item"
          :class="{ active: selectedCategoryId === null }"
          @click="emit('update:selectedCategoryId', null)"
        >
          <span>全部</span>
          <span class="vb-count">{{
            Object.values(categoryCounts).reduce((a, b) => a + b, 0)
          }}</span>
        </button>
        <button
          v-for="c in categories"
          :key="c.id"
          type="button"
          class="vb-nav-item"
          :class="{ active: selectedCategoryId === c.id }"
          @click="emit('update:selectedCategoryId', c.id)"
        >
          <span>{{ c.name }}</span>
          <span class="vb-count">{{ categoryCounts[c.id] ?? 0 }}</span>
        </button>
      </nav>
      <div class="vb-fav-summary">♥ 已收藏 {{ favoriteIds.size }} 項</div>
    </aside>

    <main class="vb-main">
      <div class="vb-search-row">
        <input
          class="vb-search"
          type="search"
          placeholder="在目前類別中搜尋…"
          :value="keyword"
          @input="emit('update:keyword', ($event.target as HTMLInputElement).value)"
        />
        <span class="vb-result-count">{{ items.length }} 筆</span>
      </div>

      <p v-if="items.length === 0" class="vb-empty">這個條件下沒有資料。</p>

      <ul class="vb-list">
        <li v-for="item in items" :key="item.id" class="vb-row-wrap">
          <div class="vb-row" @click="toggleExpand(item.id)">
            <button
              type="button"
              class="vb-star"
              :class="{ on: favoriteIds.has(item.id) }"
              :aria-label="favoriteIds.has(item.id) ? '取消收藏' : '收藏'"
              @click.stop="emit('toggleFavorite', item.id)"
            >
              {{ favoriteIds.has(item.id) ? '★' : '☆' }}
            </button>
            <span class="vb-title">{{ item.title }}</span>
            <span class="vb-tags">
              <span v-for="tag in item.tags" :key="tag" class="vb-tag">#{{ tag }}</span>
            </span>
            <span class="vb-cat">{{ categoryName(item.categoryId) }}</span>
            <span class="vb-caret">{{ expandedId === item.id ? '▾' : '▸' }}</span>
          </div>
          <div v-if="expandedId === item.id" class="vb-detail">
            <p v-if="item.useCase" class="vb-usecase">適用情境：{{ item.useCase }}</p>
            <pre class="vb-content">{{ item.content }}</pre>
            <button type="button" class="vb-copy" @click="emit('copy', item)">
              {{ copiedId === item.id ? '已複製 ✓' : '複製內容' }}
            </button>
          </div>
        </li>
      </ul>
    </main>
  </div>
</template>

<style scoped>
.vb {
  display: flex;
  min-height: 100%;
  background: #f4f6f8;
  color: #1e2530;
  font-family: system-ui, sans-serif;
}
.vb-sidebar {
  width: 210px;
  flex-shrink: 0;
  background: #1e2530;
  color: #cdd6e0;
  padding: 24px 14px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 0;
  height: 100vh;
  box-sizing: border-box;
}
.vb-brand {
  font-size: 18px;
  line-height: 1.3;
  margin: 0;
  color: #fff;
  padding: 0 8px;
}
.vb-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.vb-nav-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 10px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: #cdd6e0;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
}
.vb-nav-item:hover {
  background: #2a3342;
}
.vb-nav-item.active {
  background: #3d70c4;
  color: #fff;
}
.vb-count {
  font-size: 12px;
  opacity: 0.65;
}
.vb-fav-summary {
  margin-top: auto;
  font-size: 13px;
  color: #8fa1b8;
  padding: 0 8px;
}
.vb-main {
  flex: 1;
  padding: 24px 32px 100px;
  max-width: 900px;
}
.vb-search-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.vb-search {
  flex: 1;
  max-width: 380px;
  padding: 8px 12px;
  border: 1px solid #c8d2dd;
  border-radius: 8px;
  font-size: 14px;
}
.vb-result-count {
  font-size: 13px;
  color: #71808f;
}
.vb-empty {
  color: #71808f;
  padding: 40px 0;
}
.vb-list {
  list-style: none;
  margin: 0;
  padding: 0;
  background: #fff;
  border: 1px solid #dde4ec;
  border-radius: 10px;
  overflow: hidden;
}
.vb-row-wrap + .vb-row-wrap {
  border-top: 1px solid #edf1f5;
}
.vb-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
}
.vb-row:hover {
  background: #f7fafc;
}
.vb-star {
  border: 0;
  background: none;
  font-size: 16px;
  cursor: pointer;
  color: #b9c4cf;
  line-height: 1;
}
.vb-star.on {
  color: #eab308;
}
.vb-title {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}
.vb-tags {
  display: flex;
  gap: 6px;
  overflow: hidden;
  flex: 1;
}
.vb-tag {
  font-size: 12px;
  color: #8494a5;
  white-space: nowrap;
}
.vb-cat {
  font-size: 12px;
  color: #5c7ba6;
  background: #eaf1fa;
  border-radius: 6px;
  padding: 2px 8px;
  white-space: nowrap;
}
.vb-caret {
  color: #a5b1bd;
  font-size: 12px;
}
.vb-detail {
  padding: 4px 14px 16px 40px;
  background: #fbfcfe;
}
.vb-usecase {
  font-size: 13px;
  color: #5c6b7a;
  margin: 6px 0 10px;
}
.vb-content {
  font-size: 13px;
  background: #f0f3f7;
  border-radius: 8px;
  padding: 12px;
  white-space: pre-wrap;
  margin: 0 0 10px;
  font-family: ui-monospace, monospace;
}
.vb-copy {
  border: 1px solid #c8d2dd;
  background: #fff;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
}
.vb-copy:hover {
  background: #eef3f8;
}
</style>
