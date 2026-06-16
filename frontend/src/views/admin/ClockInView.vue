<script setup>
import { computed, onMounted, ref } from 'vue'
import { getTodayClockIns } from '@/api'

const loading = ref(false)
const data = ref({ date: '', total: 0, clocked_count: 0, absent_count: 0, records: [] })

const todayLabel = computed(() => {
  if (!data.value.date) return '今日'
  const d = new Date(data.value.date + 'T00:00:00')
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
})

onMounted(loadData)

async function loadData() {
  loading.value = true
  try {
    const res = await getTodayClockIns()
    data.value = res.data
  } finally {
    loading.value = false
  }
}

function formatTime(time) {
  if (!time) return '—'
  return new Date(time).toLocaleString('zh-CN', { hour12: false })
}

const roleMap = { admin: '管理员', member: '成员' }
</script>

<template>
  <div v-loading="loading">
    <div class="stat-cards" style="margin-bottom: 16px">
      <div class="stat-card">
        <div class="label">应到人数</div>
        <div class="value">{{ data.total }}</div>
      </div>
      <div class="stat-card green">
        <div class="label">已打卡</div>
        <div class="value">{{ data.clocked_count }}</div>
      </div>
      <div class="stat-card orange">
        <div class="label">未打卡</div>
        <div class="value">{{ data.absent_count }}</div>
      </div>
    </div>

    <div class="page-card">
      <div class="table-header">{{ todayLabel }} 打卡明细</div>
      <el-table :data="data.records" stripe>
        <el-table-column prop="real_name" label="姓名" width="120" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="student_no" label="学号/工号" width="120" />
        <el-table-column label="角色" width="90">
          <template #default="{ row }">{{ roleMap[row.role] || row.role }}</template>
        </el-table-column>
        <el-table-column label="打卡状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.clocked_in ? 'success' : 'info'" size="small">
              {{ row.clocked_in ? '已打卡' : '未打卡' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="打卡时间" min-width="180">
          <template #default="{ row }">{{ formatTime(row.clock_in_time) }}</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.table-header {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
}
</style>
