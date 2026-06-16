<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '@/api'

const loading = ref(false)
const users = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const form = reactive({
  username: '',
  password: '',
  real_name: '',
  phone: '',
  email: '',
  student_no: ''
})

onMounted(loadUsers)

async function loadUsers() {
  loading.value = true
  try {
    const res = await getAdminUsers({ role: 'member', status: 'active' })
    users.value = res.data
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.username = form.password = form.real_name = form.phone = form.email = form.student_no = ''
  dialogVisible.value = true
}

function openEdit(row) {
  editingId.value = row.user_id
  form.username = row.username
  form.password = ''
  form.real_name = row.real_name || ''
  form.phone = row.phone || ''
  form.email = row.email || ''
  form.student_no = row.student_no || ''
  dialogVisible.value = true
}

async function submit() {
  if (!form.real_name) return ElMessage.warning('请输入真实姓名')
  if (!form.phone) return ElMessage.warning('请输入联系方式')
  if (editingId.value) {
    await updateAdminUser(editingId.value, {
      real_name: form.real_name,
      phone: form.phone,
      email: form.email,
      student_no: form.student_no
    })
    ElMessage.success('信息已更新')
  } else {
    if (!form.username) return ElMessage.warning('请输入用户名')
    if (!form.password || form.password.length < 6) return ElMessage.warning('密码至少 6 位')
    if (!form.email) return ElMessage.warning('请输入邮箱')
    await createAdminUser(form)
    ElMessage.success('账号创建成功')
  }
  dialogVisible.value = false
  loadUsers()
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除员工账号「${row.real_name || row.username}」？`, '删除账号', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await deleteAdminUser(row.user_id)
    ElMessage.success('账号已删除')
    loadUsers()
  } catch {
    /* 取消 */
  }
}
</script>

<template>
  <div v-loading="loading">
    <div class="page-toolbar">
      <el-button type="primary" @click="openCreate">录入员工账号</el-button>
    </div>
    <div class="page-card">
      <el-table :data="users" stripe>
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="real_name" label="真实姓名" width="120" />
        <el-table-column prop="phone" label="联系方式" width="130" />
        <el-table-column prop="email" label="邮箱" min-width="160" />
        <el-table-column prop="student_no" label="学号/工号" width="120" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ row.created_at?.slice(0, 19).replace('T', ' ') }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑员工信息' : '录入员工账号'" width="480px">
      <el-form label-width="90px">
        <el-form-item v-if="!editingId" label="用户名" required>
          <el-input v-model="form.username" placeholder="登录用户名" />
        </el-form-item>
        <el-form-item v-if="!editingId" label="初始密码" required>
          <el-input v-model="form.password" type="password" placeholder="至少 6 位" show-password />
        </el-form-item>
        <el-form-item label="真实姓名" required>
          <el-input v-model="form.real_name" />
        </el-form-item>
        <el-form-item label="联系方式" required>
          <el-input v-model="form.phone" placeholder="手机号" />
        </el-form-item>
        <el-form-item label="邮箱" :required="!editingId">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="学号/工号">
          <el-input v-model="form.student_no" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
