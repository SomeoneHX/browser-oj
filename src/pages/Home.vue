<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Chart } from 'chart.js/auto'
import type { Chart as ChartInstance } from 'chart.js/auto'
import BaseCard from '../components/BaseCard.vue'
import { useProblems } from '../composables/useProblems'
import { useSubmissions } from '../composables/useSubmissions'

const router = useRouter()
const { all: problems, getById } = useProblems()
const { submissions } = useSubmissions()

interface Announcement {
  date: string
  title: string
  content: string
}

const announcements: Announcement[] = [
  { date: '2026-07-29', title: '欢迎使用 Browser OJ', content: '浏览器内运行的在线评测系统，支持 C / C++ / JavaScript 代码评测。' },
  { date: '2026-08-01', title: '首页功能上线', content: '新增公告、日历、随机跳题与每日做题统计。' },
  { date: '2026-08-03', title: '界面升级', content: '卡片毛玻璃效果、横向元数据卡片、文本按钮全面应用。' },
]

const now = new Date()
const year = now.getFullYear()
const month = now.getMonth()
const today = now.getDate()
const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const daysInMonth = new Date(year, month + 1, 0).getDate()
const firstWeekday = new Date(year, month, 1).getDay()
const calendarTitle = `${year}年${month + 1}月${today}日 · 星期${weekdays[now.getDay()]}`
const calendarCells = computed<(number | null)[]>(() => {
  const cells: (number | null)[] = []
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day)
  return cells
})

const jumpId = ref('')
const jumpError = ref('')
const jumpTo = () => {
  const id = jumpId.value.trim()
  if (!id) return
  const problem = getById(id)
  if (!problem) {
    jumpError.value = `题目 ${id} 不存在`
    return
  }
  jumpError.value = ''
  router.push(`/problem/${id}`)
}
const randomJump = () => {
  if (!problems.value.length) return
  const problem = problems.value[Math.floor(Math.random() * problems.value.length)]
  router.push(`/problem/${problem.id}`)
}

const CHART_DAYS = 14
const chartEl = ref<HTMLCanvasElement | null>(null)
let chart: ChartInstance | null = null
const dateKey = (ts: number) => {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const chartData = computed(() => {
  const labels: string[] = []
  const counts: Record<string, number> = {}
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  for (let i = CHART_DAYS - 1; i >= 0; i -= 1) {
    const key = dateKey(todayStart.getTime() - i * 86400000)
    labels.push(key)
    counts[key] = 0
  }
  for (const sub of submissions.value) {
    if (sub.status === 'ac' && counts[dateKey(sub.timestamp)] !== undefined) {
      counts[dateKey(sub.timestamp)] += 1
    }
  }
  return { labels, data: labels.map((key) => counts[key]) }
})

onMounted(() => {
  if (!chartEl.value) return
  chart = new Chart(chartEl.value, {
    type: 'line',
    data: {
      labels: chartData.value.labels.map((key) => key.slice(5)),
      datasets: [{
        label: '每日通过数',
        data: chartData.value.data,
        borderColor: '#1a73e8',
        backgroundColor: 'rgba(26, 115, 232, 0.08)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#1a73e8',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#999', maxTicksLimit: 7 },
        },
        y: {
          beginAtZero: true,
          suggestedMax: Math.max(...chartData.value.data, 5),
          grid: { color: 'rgba(0, 0, 0, 0.06)' },
          ticks: { color: '#999', stepSize: 1, precision: 0 },
        },
      },
    },
  })
})

watch(chartData, (value) => {
  if (!chart) return
  chart.data.labels = value.labels.map((key) => key.slice(5))
  chart.data.datasets[0].data = value.data
  chart.update()
})

onBeforeUnmount(() => chart?.destroy())
</script>

<template>
  <div class="page-container home-page">
    <BaseCard padding="lg" class="home-top-card">
      <div class="home-top-grid">
        <section class="home-section">
          <h3 class="home-section-title"><i class="fas fa-bullhorn" />公告</h3>
          <ul class="home-announcements">
            <li v-for="item in announcements" :key="item.date" class="announcement-item">
              <span class="announcement-date"><i class="far fa-calendar-alt" />{{ item.date }}</span>
              <p class="announcement-title">{{ item.title }}</p>
              <p class="announcement-content">{{ item.content }}</p>
            </li>
          </ul>
        </section>
        <section class="home-section">
          <h3 class="home-section-title"><i class="fas fa-calendar-day" />今日日历</h3>
          <p class="home-calendar-subtitle">{{ calendarTitle }}</p>
          <div class="home-calendar">
            <span v-for="w in weekdays" :key="`w-${w}`" class="home-cal-weekday">{{ w }}</span>
            <span v-for="(day, index) in calendarCells" :key="index" class="home-cal-day" :class="{ 'home-cal-today': day === today }">{{ day }}</span>
          </div>
        </section>
      </div>
    </BaseCard>
    <div class="home-bottom-grid">
      <BaseCard padding="lg" class="home-bottom-card">
        <h3 class="home-section-title"><i class="fas fa-share-square" />题目跳转</h3>
        <input v-model="jumpId" class="jump-input" type="text" placeholder="输入题号，如 P1001" @keyup.enter="jumpTo" />
        <div class="jump-buttons">
          <button class="btn-jump" @click="jumpTo"><i class="fas fa-paper-plane" />跳转题目</button>
          <button class="btn-random" @click="randomJump"><i class="fas fa-dice" />随机跳题</button>
        </div>
        <p v-if="jumpError" class="jump-error"><i class="fas fa-circle-exclamation" />{{ jumpError }}</p>
      </BaseCard>
      <BaseCard padding="lg" class="home-bottom-card">
        <h3 class="home-section-title"><i class="fas fa-chart-line" />做题历史</h3>
        <p class="home-chart-subtitle">近 {{ CHART_DAYS }} 天每日通过（AC）提交数</p>
        <div class="home-chart"><canvas ref="chartEl" /></div>
      </BaseCard>
    </div>
  </div>
</template>
