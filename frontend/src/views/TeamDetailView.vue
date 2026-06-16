<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTeam, createTask, updateTask, applyTeamExit } from '@/api'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const team = ref(null)
const showTaskDialog = ref(false)
const showExitSuccess = ref(false)
const taskForm = reactive({ title: '', description: '', assignee_id: null, status: 'todo' })

const canManage = computed(() => {
  if (!team.value) return false
  return userStore.isAdmin || team.value.leader_id === userStore.user?.user_id
})

const isMember = computed(() =>
  team.value?.members?.some((m) => m.user_id === userStore.user?.user_id)
)

const tasksByStatus = computed(() => ({
  todo: team.value?.tasks?.filter((t) => t.status === 'todo') || [],
  doing: team.value?.tasks?.filter((t) => t.status === 'doing') || [],
  done: team.value?.tasks?.filter((t) => t.status === 'done') || []
}))

onMounted(loadTeam)

async function loadTeam() {
  loading.value = true
  try {
    const res = await getTeam(route.params.id)
    team.value = res.data
  } finally {
    loading.value = false
  }
}

function openCreateTask() {
  taskForm.title = ''
  taskForm.description = ''
  taskForm.assignee_id = null
  taskForm.status = 'todo'
  showTaskDialog.value = true
}

async function submitTask() {
  if (!taskForm.title) return ElMessage.warning('请输入任务标题')
  await createTask(route.params.id, taskForm)
  ElMessage.success('任务创建成功')
  showTaskDialog.value = false
  loadTeam()
}

async function changeStatus(task, status) {
  await updateTask(route.params.id, task.task_id, { status })
  ElMessage.success('状态已更新')
  loadTeam()
}

async function confirmExit() {
  try {
    await ElMessageBox.confirm('确认退出当前开发团队？', '退出团队', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await applyTeamExit(route.params.id)
    showExitSuccess.value = true
  } catch {
    /* 用户取消 */
  }
}
</script>

<template>
  <div v-loading="loading">
    <el-page-header @back="router.push('/teams')">
      <template #content>{{ team?.team_name || '团队详情' }}</template>
    </el-page-header>

    <template v-if="team">
      <div class="detail-section page-card">
        <h4 class="section-label">项目描述：</h4>
        <p class="section-content">{{ team.description || '暂无描述' }}</p>
      </div>

      <div class="detail-section page-card">
        <h4 class="section-label">成员列表：</h4>
        <div class="member-list">
          <span v-for="m in team.members" :key="m.user_id" class="member-name">{{ m.real_name }}</span>
        </div>
      </div>

      <div class="page-card">
        <div class="board-header">
          <h3>任务看板</h3>
          <el-button v-if="canManage" type="primary" @click="openCreateTask">新建任务</el-button>
        </div>
        <div class="task-board">
          <div v-for="(label, key) in { todo: '待办', doing: '进行中', done: '已完成' }" :key="key" class="task-column">
            <h4>{{ label }} ({{ tasksByStatus[key].length }})</h4>
            <div v-for="task in tasksByStatus[key]" :key="task.task_id" class="task-item">
              <div style="font-weight: 600">{{ task.title }}</div>
              <div style="font-size: 12px; color: #909399; margin: 4px 0">{{ task.assignee_name || '未指派' }}</div>
              <el-select
                v-if="canManage || task.assignee_id === userStore.user?.user_id"
                :model-value="task.status"
                size="small"
                style="width: 100%; margin-top: 8px"
                @change="(v) => changeStatus(task, v)"
              >
                <el-option label="待办" value="todo" />
                <el-option label="进行中" value="doing" />
                <el-option label="已完成" value="done" />
              </el-select>
            </div>
          </div>
        </div>
      </div>

      <el-button v-if="isMember && !userStore.isAdmin" type="danger" class="exit-btn" @click="confirmExit">
        退出团队
      </el-button>
    </template>

    <el-dialog v-model="showTaskDialog" title="新建任务" width="480px">
      <el-form label-width="80px">
        <el-form-item label="标题"><el-input v-model="taskForm.title" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="taskForm.description" type="textarea" /></el-form-item>
        <el-form-item label="指派给">
          <el-select v-model="taskForm.assignee_id" clearable style="width: 100%">
            <el-option v-for="m in team?.members" :key="m.user_id" :label="m.real_name" :value="m.user_id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTaskDialog = false">取消</el-button>
        <el-button type="primary" @click="submitTask">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showExitSuccess" title="提示" width="400px" align-center>
      <div class="exit-success-msg">退出申请已提交，审核中</div>
      <template #footer>
        <el-button type="primary" @click="showExitSuccess = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.detail-section {
  margin: 16px 0;
}

.section-label {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 10px;
}

.section-content {
  color: #606266;
  line-height: 1.7;
  font-size: 14px;
}

.member-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.member-name {
  color: #2267f2;
  font-size: 14px;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.exit-btn {
  margin-top: 20px;
}

.exit-success-msg {
  text-align: center;
  padding: 12px 0;
  font-size: 15px;
  color: #606266;
}
</style>
