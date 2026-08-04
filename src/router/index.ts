import { createRouter, createWebHistory } from 'vue-router'
import { isLoggedIn } from '../utils/storage'
import Home from '../pages/Home.vue'
import Login from '../pages/Login.vue'
import ProblemList from '../pages/ProblemList.vue'
import ProblemDetail from '../pages/ProblemDetail.vue'
import RecordList from '../pages/RecordList.vue'
import RecordDetail from '../pages/RecordDetail.vue'
import IDE from '../pages/IDE.vue'
import Environment from '../pages/Environment.vue'
import ThemeSettings from '../pages/ThemeSettings.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: Home },
    { path: '/login', component: Login, meta: { guestOnly: true } },
    { path: '/problems', component: ProblemList },
    { path: '/problem/:problemId', component: ProblemDetail },
    { path: '/record', component: RecordList },
    { path: '/record/:recordId', component: RecordDetail },
    { path: '/ide', component: IDE },
    { path: '/environment', component: Environment },
    { path: '/theme', component: ThemeSettings },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  if (to.meta.guestOnly && isLoggedIn()) return '/'
})

export default router
