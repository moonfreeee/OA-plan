<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCourses, createCourse, updateCourse, deleteCourse, addChapter } from '@/api'

const loading = ref(false)
const courses = ref([])
const courseDialog = ref(false)
const chapterDialog = ref(false)
const editingId = ref(null)
const selectedCourseId = ref(null)
const courseForm = reactive({ title: '', category: '前端', description: '', difficulty: 'beginner', status: 'published' })
const chapterForm = reactive({ title: '', content: '', sort_order: 0, duration_min: 30 })

onMounted(loadCourses)

async function loadCourses() {
  loading.value = true
  try {
    const res = await getCourses()
    courses.value = res.data
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  Object.assign(courseForm, { title: '', category: '前端', description: '', difficulty: 'beginner', status: 'published' })
  courseDialog.value = true
}

function openEdit(row) {
  editingId.value = row.course_id
  Object.assign(courseForm, row)
  courseDialog.value = true
}

async function submitCourse() {
  if (!courseForm.title) return ElMessage.warning('请输入课程标题')
  if (editingId.value) {
    await updateCourse(editingId.value, courseForm)
    ElMessage.success('更新成功')
  } else {
    await createCourse(courseForm)
    ElMessage.success('创建成功')
  }
  courseDialog.value = false
  loadCourses()
}

async function handleDelete(row) {
  await ElMessageBox.confirm('确定删除该课程？', '提示', { type: 'warning' })
  await deleteCourse(row.course_id)
  ElMessage.success('已删除')
  loadCourses()
}

function openChapter(courseId) {
  selectedCourseId.value = courseId
  chapterForm.title = chapterForm.content = ''
  chapterForm.sort_order = 0
  chapterForm.duration_min = 30
  chapterDialog.value = true
}

async function submitChapter() {
  if (!chapterForm.title) return ElMessage.warning('请输入章节标题')
  await addChapter(selectedCourseId.value, chapterForm)
  ElMessage.success('章节已添加')
  chapterDialog.value = false
}

const difficultyMap = { beginner: '入门', intermediate: '中级', advanced: '高级' }
</script>

<template>
  <div v-loading="loading">
    <div class="page-toolbar">
      <el-button type="primary" @click="openCreate">新建课程</el-button>
    </div>
    <div class="page-card">
      <el-table :data="courses" stripe>
        <el-table-column prop="title" label="课程" />
        <el-table-column prop="category" label="分类" width="80" />
        <el-table-column label="难度" width="80">
          <template #default="{ row }">{{ difficultyMap[row.difficulty] }}</template>
        </el-table-column>
        <el-table-column prop="chapter_count" label="章节" width="70" />
        <el-table-column prop="status" label="状态" width="90" />
        <el-table-column label="操作" width="240">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="primary" @click="openChapter(row.course_id)">加章节</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-dialog v-model="courseDialog" :title="editingId ? '编辑课程' : '新建课程'" width="520px">
      <el-form label-width="60px">
        <el-form-item label="标题"><el-input v-model="courseForm.title" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="courseForm.category" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="courseForm.description" type="textarea" /></el-form-item>
        <el-form-item label="难度">
          <el-select v-model="courseForm.difficulty" style="width: 100%">
            <el-option label="入门" value="beginner" />
            <el-option label="中级" value="intermediate" />
            <el-option label="高级" value="advanced" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="courseForm.status" style="width: 100%">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="courseDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCourse">确定</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="chapterDialog" title="添加章节" width="520px">
      <el-form label-width="80px">
        <el-form-item label="标题"><el-input v-model="chapterForm.title" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="chapterForm.content" type="textarea" rows="5" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="chapterForm.sort_order" :min="0" /></el-form-item>
        <el-form-item label="时长(分)"><el-input-number v-model="chapterForm.duration_min" :min="1" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="chapterDialog = false">取消</el-button>
        <el-button type="primary" @click="submitChapter">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
