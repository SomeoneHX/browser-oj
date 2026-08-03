import { createRouter, createWebHistory } from 'vue-router'
import { isLoggedIn } from '../utils/storage'
import Login from '../pages/Login.vue'
import ProblemList from '../pages/ProblemList.vue'
import ProblemDetail from '../pages/ProblemDetail.vue'
import RecordList from '../pages/RecordList.vue'
import RecordDetail from '../pages/RecordDetail.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/problems' },
    { path: '/login', component: Login, meta: { guestOnly: true } },
    { path: '/problems', component: ProblemList },
    { path: '/problem/:problemId', component: ProblemDetail },
    { path: '/record', component: RecordList },
    { path: '/record/:recordId', component: RecordDetail },
    { path: '/:pathMatch(.*)*', redirect: '/problems' },
  ],
})

router.beforeEach((to) => {
  if (to.meta.guestOnly && isLoggedIn()) return '/problems'
})

export default router
