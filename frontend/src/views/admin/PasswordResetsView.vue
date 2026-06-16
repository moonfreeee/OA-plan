<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getPasswordResetRequests, reviewPasswordResetRequest } from '@/api'

const loading = ref(false)
const requests = ref([])
const filter = ref('pending')

onMounted(loadRequests)

async function loadRequests() {
  loading.value = true
  try {
    const res = await getPasswordResetRequests({ status: filter.value })
    requests.value = res.data
  } finally {
    loading.value = false
  }
}

async function handleReview(row, action) {
  await reviewPasswordResetRequest(row.request_id, { action })
  ElMessage.success(action === 'approve' ? '已通过，员工可使用新密码登录' : '已拒绝')
  loadRequests()
}

const statusMap = { pending: '待审核', approved: '已通过', rejected: '已拒绝' }
</script>

<template>
  <div v-loading="loading">
    <div class="page-card">
      <el-radio-group v-model="filter" style="margin-bottom: 16px" @change="loadRequests">
        <el-radio-button label="pending">待审核</el-radio-button>
        <el-radio-button label="approved">已通过</el-radio-button>
        <el-radio-button label="rejected">已拒绝</el-radio-button>
      </el-radio-group>
      <el-empty v-if="!requests.length" description="暂无密码找回申请" />
      <el-table v-else :data="requests" stripe>
        <el-table-column prop="username" label="账号" width="120" />
        <el-table-column prop="real_name" label="姓名" width="100" />
        <el-table-column prop="phone" label="联系方式" width="130" />
        <el-table-column prop="email" label="邮箱" min-width="160" />
        <el-table-column prop="student_no" label="学号/工号" width="110" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">{{ statusMap[row.status] }}</template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="170">
          <template #default="{ row }">{{ row.created_at?.slice(0, 19).replace('T', ' ') }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button size="small" type="success" @click="handleReview(row, 'approve')">通过</el-button>
              <el-button size="small" type="danger" @click="handleReview(row, 'reject')">拒绝</el-button>
            </template>
            <span v-else style="color: #909399">—</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
