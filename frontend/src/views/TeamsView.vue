<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getTeams } from '@/api'

const router = useRouter()
const loading = ref(false)
const teams = ref([])

onMounted(async () => {
  loading.value = true
  try {
    const res = await getTeams()
    teams.value = res.data
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-loading="loading">
    <el-empty v-if="!teams.length" description="您尚未加入任何团队" />
    <div v-else class="team-list">
      <div
        v-for="team in teams"
        :key="team.team_id"
        class="team-card page-card"
        @click="router.push(`/teams/${team.team_id}`)"
      >
        <h3 class="team-name">{{ team.team_name }}</h3>
        <p class="team-desc">项目简介：{{ team.description || '暂无描述' }}</p>
        <div class="team-meta">负责人：{{ team.leader_name || '未指定' }}，成员{{ team.member_count }}人</div>
      </div>
    </div>
    <el-button type="primary" class="add-team-btn" @click="router.push('/teams/overview')">
      添加其他项目团队 +
    </el-button>
  </div>
</template>

<style scoped>
.team-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.team-card {
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.team-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.team-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
}

.team-desc {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
}

.team-meta {
  font-size: 13px;
  color: #909399;
}

.add-team-btn {
  min-width: 200px;
}
</style>
