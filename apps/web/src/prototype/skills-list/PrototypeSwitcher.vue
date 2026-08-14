<script setup lang="ts">
// PROTOTYPE — 浮動變體切換列。只在 dev build 顯示，正式環境即使誤合併也不會出現。
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps<{
  variants: { key: string; name: string }[]
  current: string
  favoriteCount: number
}>()

const route = useRoute()
const router = useRouter()
const isDev = import.meta.env.DEV

const currentIndex = computed(() =>
  Math.max(
    0,
    props.variants.findIndex((v) => v.key === props.current),
  ),
)
const currentName = computed(() => props.variants[currentIndex.value]?.name ?? '')

function go(offset: number) {
  const next =
    props.variants[(currentIndex.value + offset + props.variants.length) % props.variants.length]
  if (!next) return
  router.replace({ query: { ...route.query, variant: next.key } })
}

function onKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  if (
    target &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  ) {
    return
  }
  if (e.key === 'ArrowLeft') go(-1)
  if (e.key === 'ArrowRight') go(1)
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div v-if="isDev" class="proto-switcher">
    <button type="button" aria-label="上一個變體" @click="go(-1)">←</button>
    <span class="label">
      <strong>{{ current }}</strong> — {{ currentName }}
      <span class="fav">♥ {{ favoriteCount }}</span>
    </span>
    <button type="button" aria-label="下一個變體" @click="go(1)">→</button>
  </div>
</template>

<style scoped>
.proto-switcher {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 999px;
  background: #111;
  color: #fff;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  font-family: ui-monospace, monospace;
  font-size: 13px;
}
.proto-switcher button {
  border: 0;
  border-radius: 999px;
  width: 28px;
  height: 28px;
  background: #333;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}
.proto-switcher button:hover {
  background: #555;
}
.label {
  padding: 0 10px;
  white-space: nowrap;
}
.fav {
  margin-left: 8px;
  color: #ff7b9c;
}
</style>
