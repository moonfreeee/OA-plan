<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCourses } from '@/api'

const router = useRouter()
const loading = ref(false)
const courses = ref([])

const difficultyMap = { beginner: '入门', intermediate: '中级', advanced: '高级' }

onMounted(async () => {
  loading.value = true
  try {
    const res = await getCourses()
    courses.value = res.data.filter((c) => c.status === 'published')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-loading="loading">
    <el-row :gutter="16">
      <el-col v-for="course in courses" :key="course.course_id" :span="8" style="margin-bottom: 16px">
        <el-card shadow="hover" style="cursor: pointer" @click="router.push(`/courses/${course.course_id}`)">
          <template #header>
            <div style="display: flex; justify-content: space-between">
              <span style="font-weight: 600">{{ course.title }}</span>
              <el-tag size="small">{{ course.category }}</el-tag>
            </div>
          </template>
          <p style="color: #606266; min-height: 40px">{{ course.description }}</p>
          <div style="font-size: 13px; color: #909399">
            {{ difficultyMap[course.difficulty] }} · {{ course.chapter_count }} 章节
          </div>
          <el-progress v-if="course.my_progress != null" :percentage="Math.round(course.my_progress)" style="margin-top: 8px" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
