<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import { getCourses, createCourse, updateCourse, deleteCourse, addChapter, uploadCourseVideo } from '@/api'

const loading = ref(false)
const uploadLoading = ref(false)
const courses = ref([])
const courseDialog = ref(false)
const chapterDialog = ref(false)
const editingId = ref(null)
const selectedCourseId = ref(null)
const courseForm = reactive({
  title: '',
  category: '前端',
  description: '',
  difficulty: 'beginner',
  status: 'published',
  video_url: ''
})
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
  Object.assign(courseForm, {
    title: '',
    category: '前端',
    description: '',
    difficulty: 'beginner',
    status: 'published',
    video_url: ''
  })
  courseDialog.value = true
}

function openEdit(row) {
  editingId.value = row.course_id
  Object.assign(courseForm, {
    title: row.title,
    category: row.category,
    description: row.description || '',
    difficulty: row.difficulty,
    status: row.status,
    video_url: row.video_url || ''
  })
  courseDialog.value = true
}

async function submitCourse() {
  if (!courseForm.title) return ElMessage.warning('请输入课程标题')
  const payload = { ...courseForm, video_url: courseForm.video_url || null }
  if (editingId.value) {
    await updateCourse(editingId.value, payload)
    ElMessage.success('更新成功')
  } else {
    await createCourse(payload)
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

async function handleVideoUpload({ file }) {
  if (!/\.mp4$/i.test(file.name)) {
    ElMessage.error('仅支持 MP4 格式，请先将视频转换为 .mp4')
    return
  }
  uploadLoading.value = true
  try {
    const res = await uploadCourseVideo(file)
    courseForm.video_url = res.data.url
    ElMessage.success(`视频已上传：${res.data.originalname}`)
  } catch {
    ElMessage.error('视频上传失败')
  } finally {
    uploadLoading.value = false
  }
}

function clearVideo() {
  courseForm.video_url = ''
}

function videoFileName(url) {
  if (!url) return ''
  return decodeURIComponent(url.split('/').pop())
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
        <el-table-column label="视频" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.video_url" size="small" type="success">已上传</el-tag>
            <span v-else style="color: #c0c4cc">—</span>
          </template>
        </el-table-column>
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

    <el-dialog v-model="courseDialog" :title="editingId ? '编辑课程' : '新建课程'" width="560px">
      <el-form label-width="80px">
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
        <el-form-item label="课程视频">
          <div class="video-upload">
            <el-upload
              :show-file-list="false"
              accept=".mp4,video/mp4"
              :disabled="uploadLoading"
              :http-request="handleVideoUpload"
            >
              <el-button type="primary" :loading="uploadLoading" :icon="Upload">上传 MP4 视频</el-button>
            </el-upload>
            <span class="video-upload__tip">仅支持 MP4 格式，最大 500MB</span>
            <div v-if="courseForm.video_url" class="video-upload__current">
              <span>当前：{{ videoFileName(courseForm.video_url) }}</span>
              <el-button link type="danger" @click="clearVideo">移除</el-button>
            </div>
          </div>
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

<style scoped>
.video-upload__tip {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}
.video-upload__current {
  margin-top: 8px;
  font-size: 13px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
