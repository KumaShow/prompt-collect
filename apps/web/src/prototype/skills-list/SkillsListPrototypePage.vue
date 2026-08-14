<script setup lang="ts">
// PROTOTYPE — 丟棄式頁面，回答「前台 Prompt / Skill 列表該長什麼樣？」
// 三個結構截然不同的變體掛在同一路由，用 ?variant=A|B|C 切換（浮動底部列或 ← → 鍵）。
// 狀態（搜尋、篩選、收藏）都在記憶體，切換變體時保留，方便同條件下比較。
// 假設說明：專案決定用 Tailwind 但 web 尚未安裝，prototype 先用 scoped CSS 判斷「結構與資訊層級」，
// 選定變體後折回正式程式碼時再改寫成 Tailwind。
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { categories, skillItems, type SkillItem } from './data'
import PrototypeSwitcher from './PrototypeSwitcher.vue'
import VariantA from './VariantA.vue'
import VariantB from './VariantB.vue'
import VariantC from './VariantC.vue'

const defaultVariant = { key: 'A', name: '卡片牆', component: VariantA }
const VARIANTS = [
  defaultVariant,
  { key: 'B', name: '側欄清單', component: VariantB },
  { key: 'C', name: '搜尋優先', component: VariantC },
]

const route = useRoute()
const variant = computed(() => {
  const key = String(route.query.variant ?? 'A').toUpperCase()
  return VARIANTS.find((v) => v.key === key) ?? defaultVariant
})

const keyword = ref('')
const selectedCategoryId = ref<string | null>(null)
const favoriteIds = reactive(new Set<string>())
const copiedId = ref<string | null>(null)

const filteredItems = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return skillItems.filter((item) => {
    if (selectedCategoryId.value && item.categoryId !== selectedCategoryId.value) return false
    if (!kw) return true
    return (
      item.title.toLowerCase().includes(kw) ||
      item.content.toLowerCase().includes(kw) ||
      item.tags.some((t) => t.toLowerCase().includes(kw))
    )
  })
})

const categoryCounts = computed(() =>
  Object.fromEntries(
    categories.map((c) => [c.id, skillItems.filter((i) => i.categoryId === c.id).length]),
  ),
)

function logState(action: string) {
  console.log(`[prototype] ${action}`, {
    variant: variant.value.key,
    keyword: keyword.value,
    selectedCategoryId: selectedCategoryId.value,
    favorites: [...favoriteIds],
    visibleCount: filteredItems.value.length,
  })
}

function toggleFavorite(id: string) {
  if (favoriteIds.has(id)) favoriteIds.delete(id)
  else favoriteIds.add(id)
  logState(`toggleFavorite(${id})`)
}

let copiedTimer: ReturnType<typeof setTimeout> | undefined
async function copy(item: SkillItem) {
  await navigator.clipboard.writeText(item.content)
  copiedId.value = item.id
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copiedId.value = null), 1500)
  logState(`copy(${item.id})`)
}

watch(variant, () => logState('switchVariant'))
</script>

<template>
  <!-- 全螢幕覆蓋層：蓋掉 App.vue 的 scaffold placeholder，prototype 移除時零殘留 -->
  <div class="proto-overlay">
    <component
      :is="variant.component"
      :categories="categories"
      :items="filteredItems"
      :category-counts="categoryCounts"
      :keyword="keyword"
      :selected-category-id="selectedCategoryId"
      :favorite-ids="favoriteIds"
      :copied-id="copiedId"
      @update:keyword="keyword = $event"
      @update:selected-category-id="selectedCategoryId = $event"
      @toggle-favorite="toggleFavorite"
      @copy="copy"
    />
    <PrototypeSwitcher
      :variants="VARIANTS"
      :current="variant.key"
      :favorite-count="favoriteIds.size"
    />
  </div>
</template>

<style scoped>
.proto-overlay {
  position: fixed;
  inset: 0;
  overflow-y: auto;
  z-index: 100;
  background: #fff;
}
</style>
