<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { VideoPlay } from '@element-plus/icons-vue'
import { getCourses } from '@/api'
import { isMp4Url } from '@/utils/videoUrl'

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
    <div class="page-toolbar" style="margin-bottom: 16px">
      <el-button type="primary" :icon="VideoPlay" @click="router.push('/courses/videos')">
        视频学习
      </el-button>
      <span class="toolbar-hint">观看 MongoDB / QueryData 演示视频及课程配套视频</span>
    </div>
    <el-row :gutter="16">
      <el-col v-for="course in courses" :key="course.course_id" :span="8" style="margin-bottom: 16px">
        <el-card shadow="hover" style="cursor: pointer" @click="router.push(`/courses/${course.course_id}`)">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span style="font-weight: 600">{{ course.title }}</span>
              <div>
                <el-tag v-if="isMp4Url(course.video_url)" size="small" type="warning" style="margin-right: 6px">含视频</el-tag>
                <el-tag size="small">{{ course.category }}</el-tag>
              </div>
            </div>
          </template>
          <p style="color: #606266; min-height: 40px">{{ course.description }}</p>
          <div style="font-size: 13px; color: #909399">
            {{ difficultyMap[course.difficulty] }} · {{ course.chapter_count }} 章节
          </div>
          <el-progress v-if="course.my_progress != null" :percentage="Math.round(course.my_progress)" style="margin-top: 8px" />
          <el-button
            v-if="isMp4Url(course.video_url)"
            link
            type="primary"
            style="margin-top: 8px"
            @click.stop="router.push({ path: '/courses/videos', query: { url: course.video_url, title: course.title } })"
          >
            播放课程视频
          </el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.toolbar-hint {
  margin-left: 12px;
  font-size: 13px;
  color: #909399;
}
</style>
