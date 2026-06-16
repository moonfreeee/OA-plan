<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyScores, queryAssessmentPeriods } from '@/api'

const loading = ref(false)
const scores = ref([])
const periods = ref([])
const queried = ref(false)

const years = [2026, 2025, 2024, 2023]
const months = Array.from({ length: 12 }, (_, i) => i + 1)
const days = Array.from({ length: 31 }, (_, i) => i + 1)

const filter = reactive({ year: 2025, month: 6, day: null })

const statusMap = { draft: '草稿', active: '进行中', closed: '已结束' }
const statusType = { draft: 'info', active: 'primary', closed: 'success' }

function formatDate(value) {
  if (!value) return ''
  const s = String(value)
  return s.includes('T') ? s.slice(0, 10) : s
}

onMounted(() => query())

async function query() {
  loading.value = true
  queried.value = true
  try {
    const params = {}
    if (filter.year) params.year = filter.year
    if (filter.month) params.month = filter.month
    if (filter.day) params.day = filter.day
    const [s, p] = await Promise.all([getMyScores(params), queryAssessmentPeriods(params)])
    scores.value = s.data
    periods.value = p.data
    if (!periods.value.length && !scores.value.length) {
      ElMessage.info('该时间段暂无考核记录')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-loading="loading">
    <div class="assessment-filter page-card">
      <el-select v-model="filter.year" placeholder="年" style="width: 100px; margin-right: 12px">
        <el-option v-for="y in years" :key="y" :label="`${y}`" :value="y" />
      </el-select>
      <el-select v-model="filter.month" placeholder="月" clearable style="width: 100px; margin-right: 12px">
        <el-option v-for="m in months" :key="m" :label="`${m}月`" :value="m" />
      </el-select>
      <el-select v-model="filter.day" placeholder="日" clearable style="width: 100px; margin-right: 12px">
        <el-option v-for="d in days" :key="d" :label="`${d}日`" :value="d" />
      </el-select>
      <el-button type="primary" @click="query">查询</el-button>
    </div>

    <template v-if="queried">
      <div v-if="periods.length" class="page-card" style="margin-bottom: 16px">
        <h3 class="section-title">考核周期</h3>
        <div v-for="period in periods" :key="period.period_id" class="period-block">
          <div class="period-row">
            <span class="label">周期名称</span>
            <span>{{ period.title }}</span>
          </div>
          <div class="period-row">
            <span class="label">开始日期</span>
            <span>{{ formatDate(period.start_date) }}</span>
            <span class="label" style="margin-left: 32px">结束日期</span>
            <span>{{ formatDate(period.end_date) }}</span>
          </div>
          <div class="period-row">
            <span class="label">状态</span>
            <el-tag :type="statusType[period.status]" size="small">{{ statusMap[period.status] }}</el-tag>
          </div>
        </div>
      </div>

      <div class="page-card">
        <h3 class="section-title">我的成绩</h3>
        <el-empty v-if="!scores.length" description="该时间段暂无已发布的考核成绩" />
        <div v-for="score in scores" :key="score.score_id" class="score-block">
          <div class="score-period">{{ score.period_title }}</div>
          <div class="score-grid">
            <div class="score-item"><span>技术能力</span><strong>{{ score.tech_score }}</strong></div>
            <div class="score-item"><span>团队协作</span><strong>{{ score.team_score }}</strong></div>
            <div class="score-item"><span>工作态度</span><strong>{{ score.attitude_score }}</strong></div>
            <div class="score-item"><span>项目贡献</span><strong>{{ score.contribution_score }}</strong></div>
            <div class="score-item"><span>平均分</span><strong>{{ Math.round(score.avg_score || 0) }}</strong></div>
          </div>
          <div v-if="score.comment" class="score-comment">评语：{{ score.comment }}</div>
        </div>
        <div v-if="periods.length && !scores.length" class="score-hint">
          考核周期「{{ periods[0].title }}」成绩尚未发布
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.assessment-filter {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.period-block {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px 20px;
}

.period-block + .period-block {
  margin-top: 12px;
}

.period-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.period-row:last-child {
  margin-bottom: 0;
}

.period-row .label {
  color: #909399;
  width: 72px;
  flex-shrink: 0;
}

.score-block {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px 20px;
}

.score-block + .score-block {
  margin-top: 12px;
}

.score-period {
  font-weight: 600;
  margin-bottom: 12px;
}

.score-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.score-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
}

.score-item span {
  color: #909399;
}

.score-item strong {
  font-size: 20px;
  color: #303133;
}

.score-comment {
  margin-top: 12px;
  font-size: 14px;
  color: #606266;
}

.score-hint {
  color: #909399;
  font-size: 14px;
}
</style>
