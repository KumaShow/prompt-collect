<script setup lang="ts">
// PROTOTYPE — 丟棄式頁面，回答「後台管理介面該長什麼樣？」
// 三個「資訊架構」截然不同的變體掛同一路由，?variant=A|B|C 切換（浮動底部列或 ← → 鍵）：
//   A 側欄分頁式：獨立表單頁取代列表（傳統 admin）
//   B 單頁 tab：抽屜表單，列表保持可見（SaaS 風）
//   C 就地編輯表格：沒有表單頁，一切在列上發生（Airtable 感）
// 共用同一個記憶體 store（含 api-spec 的驗證規則：空白 400、name unique、刪除 RESTRICT），
// 切換變體時資料保留，方便同條件比較。後端 admin API 尚未實作，全部為 stub。
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PrototypeSwitcher from '../skills-list/PrototypeSwitcher.vue'
import { createAdminStore } from './store'
import VariantA from './VariantA.vue'
import VariantB from './VariantB.vue'
import VariantC from './VariantC.vue'

const defaultVariant = { key: 'A', name: '側欄分頁式', component: VariantA }
const VARIANTS = [
  defaultVariant,
  { key: 'B', name: '單頁 tab＋抽屜', component: VariantB },
  { key: 'C', name: '就地編輯表格', component: VariantC },
]

const route = useRoute()
const variant = computed(() => {
  const key = String(route.query.variant ?? 'A').toUpperCase()
  return VARIANTS.find((v) => v.key === key) ?? defaultVariant
})

const store = createAdminStore()
</script>

<template>
  <!-- 全螢幕覆蓋層：蓋掉 scaffold placeholder，prototype 移除時零殘留 -->
  <div class="proto-overlay">
    <component :is="variant.component" :store="store" />
    <PrototypeSwitcher :variants="VARIANTS" :current="variant.key" />
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
