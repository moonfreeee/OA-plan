<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getAssessmentPeriods,
  createAssessmentPeriod,
  updateAssessmentPeriod,
  getPeriodScores,
  saveScore,
  getAdminUsers
} from '@/api'

const loading = ref(false)
const periods = ref([])
const scores = ref([])
const members = ref([])
const selectedPeriod = ref(null)
const periodDialog = ref(false)
const scoreDialog = ref(false)
const periodForm = reactive({ title: '', start_date: '', end_date: '', status: 'draft' })
const scoreForm = reactive({
  user_id: null,
  tech_score: 80,
  team_score: 80,
  attitude_score: 80,
  contribution_score: 80,
  comment: '',
  published: true
})

onMounted(async () => {
  await Promise.all([loadPeriods(), loadMembers()])
})

async function loadPeriods() {
  loading.value = true
  try {
    const res = await getAssessmentPeriods()
    periods.value = res.data
  } finally {
    loading.value = false
  }
}

async function loadMembers() {
  const res = await getAdminUsers({ status: 'active' })
  members.value = res.data.filter((u) => u.role === 'member')
}

function openCreatePeriod() {
  periodForm.title = ''
  periodForm.start_date = ''
  periodForm.end_date = ''
  periodForm.status = 'draft'
  periodDialog.value = true
}

async function submitPeriod() {
  await createAssessmentPeriod(periodForm)
  ElMessage.success('考核周期已创建')
  periodDialog.value = false
  loadPeriods()
}

async function selectPeriod(row) {
  selectedPeriod.value = row.period_id
  const res = await getPeriodScores(row.period_id)
  scores.value = res.data
}

function openScoreDialog() {
  scoreForm.user_id = null
  scoreForm.tech_score = scoreForm.team_score = scoreForm.attitude_score = scoreForm.contribution_score = 80
  scoreForm.comment = ''
  scoreForm.published = true
  scoreDialog.value = true
}

async function submitScore() {
  if (!scoreForm.user_id) return ElMessage.warning('请选择成员')
  await saveScore({ period_id: selectedPeriod.value, ...scoreForm, published: scoreForm.published ? 1 : 0 })
  ElMessage.success('成绩已保存')
  scoreDialog.value = false
  selectPeriod({ period_id: selectedPeriod.value })
}

async function changePeriodStatus(row, status) {
  await updateAssessmentPeriod(row.period_id, { status })
  ElMessage.success('状态已更新')
  loadPeriods()
}

const statusMap = { draft: '草稿', active: '进行中', closed: '已结束' }
</script>

<template>
  <div v-loading="loading">
    <div class="page-toolbar">
      <el-button type="primary" @click="openCreatePeriod">新建考核周期</el-button>
    </div>
    <el-row :gutter="16">
      <el-col :span="10">
        <div class="page-card">
          <h3 style="margin-bottom: 12px">考核周期</h3>
          <el-table :data="periods" highlight-current-row @row-click="selectPeriod">
            <el-table-column prop="title" label="名称" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">{{ statusMap[row.status] }}</template>
            </el-table-column>
            <el-table-column label="操作" width="140">
              <template #default="{ row }">
                <el-button v-if="row.status === 'draft'" size="small" @click.stop="changePeriodStatus(row, 'active')">启动</el-button>
                <el-button v-if="row.status === 'active'" size="small" @click.stop="changePeriodStatus(row, 'closed')">结束</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :span="14">
        <div class="page-card">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px">
            <h3>成绩录入</h3>
            <el-button v-if="selectedPeriod" type="primary" size="small" @click="openScoreDialog">录入成绩</el-button>
          </div>
          <el-empty v-if="!selectedPeriod" description="请选择考核周期" />
          <el-table v-else :data="scores" stripe>
            <el-table-column prop="real_name" label="成员" />
            <el-table-column prop="tech_score" label="技术" width="70" />
            <el-table-column prop="team_score" label="协作" width="70" />
            <el-table-column prop="attitude_score" label="态度" width="70" />
            <el-table-column prop="contribution_score" label="贡献" width="70" />
            <el-table-column label="发布" width="70">
              <template #default="{ row }">{{ row.published ? '是' : '否' }}</template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
    <el-dialog v-model="periodDialog" title="新建考核周期" width="480px">
      <el-form label-width="80px">
        <el-form-item label="名称"><el-input v-model="periodForm.title" /></el-form-item>
        <el-form-item label="开始"><el-date-picker v-model="periodForm.start_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        <el-form-item label="结束"><el-date-picker v-model="periodForm.end_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="periodDialog = false">取消</el-button>
        <el-button type="primary" @click="submitPeriod">确定</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="scoreDialog" title="录入成绩" width="480px">
      <el-form label-width="80px">
        <el-form-item label="成员">
          <el-select v-model="scoreForm.user_id" style="width: 100%">
            <el-option v-for="m in members" :key="m.user_id" :label="m.real_name" :value="m.user_id" />
          </el-select>
        </el-form-item>
        <el-form-item label="技术"><el-input-number v-model="scoreForm.tech_score" :min="0" :max="100" /></el-form-item>
        <el-form-item label="协作"><el-input-number v-model="scoreForm.team_score" :min="0" :max="100" /></el-form-item>
        <el-form-item label="态度"><el-input-number v-model="scoreForm.attitude_score" :min="0" :max="100" /></el-form-item>
        <el-form-item label="贡献"><el-input-number v-model="scoreForm.contribution_score" :min="0" :max="100" /></el-form-item>
        <el-form-item label="评语"><el-input v-model="scoreForm.comment" type="textarea" /></el-form-item>
        <el-form-item label="发布"><el-switch v-model="scoreForm.published" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scoreDialog = false">取消</el-button>
        <el-button type="primary" @click="submitScore">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
