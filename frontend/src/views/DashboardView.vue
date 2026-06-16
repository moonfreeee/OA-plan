<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Reading, Document, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { getDashboard, clockIn as apiClockIn, getClockInStatus } from '@/api'
import { useUserStore } from '@/stores/user'
import UserAvatar from '@/components/UserAvatar.vue'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const clockLoading = ref(false)
const data = ref({ stats: {}, announcements: [], activities: [] })
const clockedIn = ref(false)

const displayName = computed(() => userStore.user?.real_name || userStore.user?.username || '用户')

onMounted(async () => {
  await Promise.all([loadData(), loadClockStatus()])
})

async function loadData() {
  loading.value = true
  try {
    const res = await getDashboard()
    data.value = res.data
  } finally {
    loading.value = false
  }
}

async function loadClockStatus() {
  try {
    const res = await getClockInStatus()
    clockedIn.value = res.data.clockedIn
  } catch {
    clockedIn.value = false
  }
}

async function handleClockIn() {
  if (clockedIn.value) {
    ElMessage.info('今日已打卡')
    return
  }
  clockLoading.value = true
  try {
    await apiClockIn()
    clockedIn.value = true
    ElMessage.success('打卡成功')
  } finally {
    clockLoading.value = false
  }
}

function formatTime(time) {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN', { hour12: false })
}
</script>

<template>
  <div v-loading="loading" class="dashboard">
    <div class="dashboard__grid">
      <!-- 用户欢迎卡片 -->
      <div class="welcome-card">
        <div class="welcome-card__top">
          <div class="welcome-card__profile">
            <UserAvatar :user="userStore.user" :size="80" />
            <div class="welcome-card__greet">
              <span class="welcome-card__hi">欢迎您</span>
              <span class="welcome-card__name">{{ displayName }}</span>
            </div>
          </div>
          <div class="welcome-card__stats">
            <p>所属团队：{{ data.stats.teamLabel || '暂无' }}</p>
            <p>课程学习：{{ data.stats.courseLabel || '暂无' }}</p>
            <p>待完成考核：{{ data.stats.assessmentLabel || '暂无' }}</p>
          </div>
        </div>
        <div class="welcome-card__actions">
          <button
            type="button"
            class="action-btn"
            :disabled="clockLoading"
            @click="handleClockIn"
          >
            <span class="action-btn__icon" :class="clockedIn ? 'is-success' : 'is-fail'">
              <el-icon v-if="clockedIn"><CircleCheck /></el-icon>
              <el-icon v-else><CircleClose /></el-icon>
            </span>
            <span class="action-btn__label">{{ clockedIn ? '已打卡' : '今日未打卡' }}</span>
          </button>
          <button type="button" class="action-btn" @click="router.push('/courses')">
            <span class="action-btn__icon is-neutral">
              <el-icon><Reading /></el-icon>
            </span>
            <span class="action-btn__label">课程学习</span>
          </button>
          <button type="button" class="action-btn" @click="router.push('/assessment')">
            <span class="action-btn__icon is-neutral">
              <el-icon><Document /></el-icon>
            </span>
            <span class="action-btn__label">我的考核</span>
          </button>
        </div>
      </div>

      <!-- 近期动态（右侧通栏） -->
      <div class="panel panel--timeline">
        <h3 class="panel__title">近期动态</h3>
        <el-empty v-if="!data.activities.length" description="暂无动态" />
        <div v-else class="timeline">
          <div v-for="(act, i) in data.activities" :key="i" class="timeline__item">
            <div class="timeline__rail">
              <div class="timeline__dot" :class="{ 'is-muted': i === data.activities.length - 1 }" />
              <div v-if="i < data.activities.length - 1" class="timeline__line" />
            </div>
            <div class="timeline__content">
              <p class="timeline__text">{{ act.title }}：{{ act.detail }}</p>
              <p class="timeline__time">{{ formatTime(act.time) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 最新公告 -->
      <div class="panel panel--announce">
        <h3 class="panel__title">最新公告</h3>
        <el-empty v-if="!data.announcements.length" description="暂无公告" />
        <ul v-else class="announce-list">
          <li v-for="item in data.announcements" :key="item.announcement_id" class="announce-item">
            <span class="announce-item__dot">·</span>
            <span class="announce-item__text">
              <span class="announce-item__title">{{ item.title }}：</span>
              <span class="announce-item__content">{{ item.content }}</span>
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1200px;
}

.dashboard__grid {
  display: grid;
  grid-template-columns: 1fr 272px;
  grid-template-rows: auto 1fr;
  gap: 12px;
  align-items: stretch;
}

.welcome-card {
  grid-column: 1;
  grid-row: 1;
  background: #fff;
  border-radius: 10px;
  padding: 20px 24px 18px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}

.welcome-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 35px;
  margin-bottom: 16px;
}

.welcome-card__profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.welcome-card__greet {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.welcome-card__hi {
  font-size: 15px;
  color: #b8b8b8;
}

.welcome-card__name {
  font-family: 'Kingsoft Cloud Font', 'Alimama ShuHeiTi', 'Microsoft YaHei', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.3;
}

.welcome-card__stats {
  font-size: 18px;
  color: #333;
  line-height: 1.75;
  text-align: left;
  flex-shrink: 0;
  padding-top: 8px;
}

.welcome-card__stats p {
  margin: 0;
}

.welcome-card__actions {
  display: flex;
  align-items: flex-start;
  gap: 36px;
  padding-left: 4px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  min-width: 64px;
}

.action-btn__icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.action-btn__icon.is-fail {
  background: #fde8e8;
  color: #e74c3c;
}

.action-btn__icon.is-success {
  background: #e8f8ef;
  color: #27ae60;
}

.action-btn__icon.is-neutral {
  background: #ececec;
  color: #777;
}

.action-btn__label {
  font-size: 13px;
  color: #333;
  white-space: nowrap;
}

.panel {
  background: #fff;
  border-radius: 10px;
  padding: 18px 22px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}

.panel__title {
  font-family: 'Kingsoft Cloud Font', 'Alimama ShuHeiTi', 'Microsoft YaHei', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 14px;
}

.panel--timeline {
  grid-column: 2;
  grid-row: 1 / 3;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.panel--announce {
  grid-column: 1;
  grid-row: 2;
  align-self: start;
}

.announce-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.announce-item {
  display: flex;
  align-items: flex-start;
  gap: 2px;
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.55;
}

.announce-item:last-child {
  margin-bottom: 0;
}

.announce-item__dot {
  color: #b8b8b8;
  flex-shrink: 0;
  line-height: 1.55;
}

.announce-item__title {
  color: #333;
}

.announce-item__content {
  color: #b8b8b8;
}

.timeline__item {
  display: flex;
  gap: 12px;
  min-height: 56px;
}

.timeline__item:not(:last-child) {
  margin-bottom: 4px;
}

.timeline__rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 12px;
  flex-shrink: 0;
  padding-top: 5px;
}

.timeline__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2267f2;
  flex-shrink: 0;
}

.timeline__dot.is-muted {
  background: #ccc;
}

.timeline__line {
  flex: 1;
  width: 2px;
  background: #2267f2;
  margin-top: 4px;
  min-height: 36px;
}

.timeline__content {
  flex: 1;
  padding-bottom: 12px;
}

.timeline__text {
  font-size: 13px;
  color: #333;
  line-height: 1.45;
  margin: 0 0 3px;
}

.timeline__time {
  font-size: 12px;
  color: #b8b8b8;
  margin: 0;
}

@media (max-width: 960px) {
  .dashboard__grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }

  .panel--timeline,
  .panel--announce,
  .welcome-card {
    grid-column: 1;
    grid-row: auto;
  }

  .welcome-card__top {
    flex-direction: column;
  }
}
</style>
