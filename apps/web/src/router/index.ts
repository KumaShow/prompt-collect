import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // PROTOTYPE — 丟棄式路由，UI 探索用（?variant=A|B|C），選定方向後整段移除
    {
      path: '/prototype/skills-list',
      name: 'prototype-skills-list',
      component: () => import('../prototype/skills-list/SkillsListPrototypePage.vue'),
    },
  ],
})

export default router
