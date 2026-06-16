<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getTeams,
  createTeam,
  updateTeam,
  addTeamMember,
  getAdminUsers,
  getTeamRequests,
  reviewTeamRequest
} from '@/api'

const loading = ref(false)
const requestLoading = ref(false)
const activeTab = ref('teams')
const teams = ref([])
const requests = ref([])
const members = ref([])
const dialogVisible = ref(false)
const memberDialogVisible = ref(false)
const editingId = ref(null)
const selectedTeamId = ref(null)
const form = reactive({ team_name: '', description: '', leader_id: null })
const memberForm = reactive({ user_id: null })

onMounted(async () => {
  await Promise.all([loadTeams(), loadMembers(), loadRequests()])
})

async function loadTeams() {
  loading.value = true
  try {
    const res = await getTeams({ all: '1' })
    teams.value = res.data
  } finally {
    loading.value = false
  }
}

async function loadRequests() {
  requestLoading.value = true
  try {
    const res = await getTeamRequests({ status: 'pending' })
    requests.value = res.data
  } finally {
    requestLoading.value = false
  }
}

async function loadMembers() {
  const res = await getAdminUsers({ status: 'active' })
  members.value = res.data.filter((u) => u.role === 'member')
}

function openCreate() {
  editingId.value = null
  form.team_name = form.description = ''
  form.leader_id = null
  dialogVisible.value = true
}

function openEdit(row) {
  editingId.value = row.team_id
  form.team_name = row.team_name
  form.description = row.description
  form.leader_id = row.leader_id
  dialogVisible.value = true
}

async function submit() {
  if (!form.team_name) return ElMessage.warning('请输入团队名称')
  if (editingId.value) {
    await updateTeam(editingId.value, form)
    ElMessage.success('更新成功')
  } else {
    await createTeam(form)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  loadTeams()
}

function openAddMember(teamId) {
  selectedTeamId.value = teamId
  memberForm.user_id = null
  memberDialogVisible.value = true
}

async function submitMember() {
  if (!memberForm.user_id) return ElMessage.warning('请选择成员')
  await addTeamMember(selectedTeamId.value, { user_id: memberForm.user_id })
  ElMessage.success('成员已添加')
  memberDialogVisible.value = false
}

async function handleReview(row, action) {
  await reviewTeamRequest(row.request_id, { action })
  ElMessage.success(action === 'approve' ? '已通过' : '已拒绝')
  await Promise.all([loadRequests(), loadTeams()])
}

function typeLabel(type) {
  return type === 'join' ? '加入申请' : '退出申请'
}
</script>

<template>
  <div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="团队列表" name="teams">
        <div v-loading="loading">
          <div class="page-toolbar">
            <el-button type="primary" @click="openCreate">创建团队</el-button>
          </div>
          <div class="page-card">
            <el-table :data="teams" stripe>
              <el-table-column prop="team_name" label="团队名称" />
              <el-table-column prop="description" label="描述" show-overflow-tooltip />
              <el-table-column prop="leader_name" label="负责人" width="100" />
              <el-table-column prop="member_count" label="成员数" width="80" />
              <el-table-column label="操作" width="200">
                <template #default="{ row }">
                  <el-button size="small" @click="openEdit(row)">编辑</el-button>
                  <el-button size="small" type="primary" @click="openAddMember(row.team_id)">添加成员</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane name="requests">
        <template #label>
          加入/退出申请
          <el-badge v-if="requests.length" :value="requests.length" style="margin-left: 6px" />
        </template>
        <div v-loading="requestLoading" class="page-card">
          <el-empty v-if="!requests.length" description="暂无待审核申请" />
          <el-table v-else :data="requests" stripe>
            <el-table-column label="类型" width="100">
              <template #default="{ row }">{{ typeLabel(row.type) }}</template>
            </el-table-column>
            <el-table-column prop="user_name" label="申请人" width="100" />
            <el-table-column prop="team_name" label="团队" />
            <el-table-column prop="created_at" label="申请时间" width="180">
              <template #default="{ row }">{{ row.created_at?.slice(0, 19).replace('T', ' ') }}</template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="{ row }">
                <el-button size="small" type="success" @click="handleReview(row, 'approve')">通过</el-button>
                <el-button size="small" type="danger" @click="handleReview(row, 'reject')">拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑团队' : '创建团队'" width="480px">
      <el-form label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.team_name" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" /></el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="form.leader_id" clearable style="width: 100%">
            <el-option v-for="m in members" :key="m.user_id" :label="m.real_name" :value="m.user_id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="memberDialogVisible" title="添加成员" width="400px">
      <el-select v-model="memberForm.user_id" placeholder="选择成员" style="width: 100%">
        <el-option v-for="m in members" :key="m.user_id" :label="m.real_name" :value="m.user_id" />
      </el-select>
      <template #footer>
        <el-button @click="memberDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMember">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
