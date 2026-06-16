<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/api'

const loading = ref(false)
const list = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const form = reactive({ title: '', content: '' })

onMounted(loadList)

async function loadList() {
  loading.value = true
  try {
    const res = await getAnnouncements()
    list.value = res.data
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.title = form.content = ''
  dialogVisible.value = true
}

function openEdit(row) {
  editingId.value = row.announcement_id
  form.title = row.title
  form.content = row.content
  dialogVisible.value = true
}

async function submit() {
  if (!form.title || !form.content) return ElMessage.warning('请填写完整')
  if (editingId.value) {
    await updateAnnouncement(editingId.value, form)
    ElMessage.success('更新成功')
  } else {
    await createAnnouncement(form)
    ElMessage.success('发布成功')
  }
  dialogVisible.value = false
  loadList()
}

async function handleDelete(row) {
  await ElMessageBox.confirm('确定删除该公告？', '提示', { type: 'warning' })
  await deleteAnnouncement(row.announcement_id)
  ElMessage.success('已删除')
  loadList()
}
</script>

<template>
  <div v-loading="loading">
    <div class="page-toolbar">
      <el-button type="primary" @click="openCreate">发布公告</el-button>
    </div>
    <div class="page-card">
      <el-table :data="list" stripe>
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="publisher_name" label="发布人" width="120" />
        <el-table-column label="时间" width="180">
          <template #default="{ row }">{{ new Date(row.created_at).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑公告' : '发布公告'" width="520px">
      <el-form label-width="60px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="form.content" type="textarea" rows="5" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
