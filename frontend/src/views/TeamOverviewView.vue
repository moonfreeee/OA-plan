<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTeamOverview, applyTeamJoin } from '@/api'

const router = useRouter()
const loading = ref(false)
const teams = ref([])

onMounted(loadTeams)

async function loadTeams() {
  loading.value = true
  try {
    const res = await getTeamOverview()
    teams.value = res.data
  } finally {
    loading.value = false
  }
}

function statusLabel(status) {
  const map = {
    joined: '已加入',
    pending: '申请中',
    exit_pending: '已加入',
    none: '申请加入'
  }
  return map[status] || status
}

function statusClass(status) {
  if (status === 'none') return 'action'
  return 'muted'
}

async function handleAction(team) {
  if (team.membership_status === 'joined' || team.membership_status === 'exit_pending') {
    router.push(`/teams/${team.team_id}`)
    return
  }
  if (team.membership_status === 'pending') return
  try {
    await ElMessageBox.confirm(`确认申请加入「${team.team_name}」？`, '申请加入', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info'
    })
    await applyTeamJoin(team.team_id)
    ElMessage.success('加入申请已提交，请等待管理员审核')
    loadTeams()
  } catch {
    /* 用户取消 */
  }
}
</script>

<template>
  <div v-loading="loading">
    <el-page-header @back="router.push('/teams')">
      <template #content>我的团队</template>
    </el-page-header>

    <div class="overview-list">
      <div v-for="team in teams" :key="team.team_id" class="overview-card page-card">
        <h3 class="team-name">{{ team.team_name }}</h3>
        <p class="team-desc">职责简介：{{ team.description || '暂无描述' }}</p>
        <div class="card-footer">
          <span class="team-meta">负责人：{{ team.leader_name || '未指定' }}，成员{{ team.member_count }}人</span>
          <span
            :class="['status-tag', statusClass(team.membership_status)]"
            @click="handleAction(team)"
          >
            {{ statusLabel(team.membership_status) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.overview-card .team-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
}

.team-desc {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.team-meta {
  font-size: 13px;
  color: #909399;
}

.status-tag {
  font-size: 14px;
}

.status-tag.muted {
  color: #909399;
}

.status-tag.action {
  color: #2267f2;
  cursor: pointer;
}

.status-tag.action:hover {
  text-decoration: underline;
}
</style>
