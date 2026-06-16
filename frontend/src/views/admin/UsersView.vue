<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdminUsers, approveUser } from '@/api'

const loading = ref(false)
const users = ref([])
const filter = ref('pending')

onMounted(loadUsers)

async function loadUsers() {
  loading.value = true
  try {
    const res = await getAdminUsers(filter.value ? { status: filter.value } : {})
    users.value = res.data
  } finally {
    loading.value = false
  }
}

async function handleApprove(id, action) {
  await approveUser(id, action)
  ElMessage.success(action === 'active' ? '已通过' : '已拒绝')
  loadUsers()
}

const statusMap = { pending: '待审核', active: '已通过', rejected: '已拒绝' }
</script>

<template>
  <div v-loading="loading">
    <div class="page-card">
      <el-radio-group v-model="filter" style="margin-bottom: 16px" @change="loadUsers">
        <el-radio-button label="pending">待审核</el-radio-button>
        <el-radio-button label="active">已通过</el-radio-button>
        <el-radio-button label="rejected">已拒绝</el-radio-button>
        <el-radio-button label="">全部</el-radio-button>
      </el-radio-group>
      <el-table :data="users" stripe>
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="real_name" label="姓名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="student_no" label="学号" />
        <el-table-column label="状态">
          <template #default="{ row }">{{ statusMap[row.status] }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button size="small" type="success" @click="handleApprove(row.user_id, 'active')">通过</el-button>
              <el-button size="small" type="danger" @click="handleApprove(row.user_id, 'rejected')">拒绝</el-button>
            </template>
            <span v-else style="color: #909399">—</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
