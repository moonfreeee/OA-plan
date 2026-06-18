<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCourse, completeChapter } from '@/api'
import { videoPlayUrl, isMp4Url } from '@/utils/videoUrl'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const course = ref(null)
const activeChapter = ref(null)

onMounted(loadCourse)

async function loadCourse() {
  loading.value = true
  try {
    const res = await getCourse(route.params.id)
    course.value = res.data
    if (course.value.chapters?.length) {
      activeChapter.value = course.value.chapters[0]
    }
  } finally {
    loading.value = false
  }
}

async function markComplete(chapter) {
  await completeChapter(chapter.chapter_id)
  ElMessage.success('已标记完成')
  loadCourse()
}

function videoSrc(url) {
  return videoPlayUrl({ url, video_url: url })
}

function openVideoPage() {
  router.push({
    path: '/courses/videos',
    query: { url: course.value.video_url, title: course.value.title }
  })
}
</script>

<template>
  <div v-loading="loading">
    <el-page-header @back="$router.push('/courses')">
      <template #content>{{ course?.title || '课程详情' }}</template>
    </el-page-header>

    <div v-if="course" style="margin-top: 16px">
      <div v-if="isMp4Url(course.video_url)" class="page-card" style="margin-bottom: 16px">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px">
          <h3 style="margin: 0">课程视频</h3>
          <el-button type="primary" link @click="openVideoPage">全屏播放</el-button>
        </div>
        <div class="video-box">
          <video class="video-box__player" controls :src="videoSrc(course.video_url)">
            您的浏览器不支持视频播放，请使用 Edge 浏览器。
          </video>
        </div>
      </div>

      <el-progress :percentage="course.progress_pct" style="margin-bottom: 16px" />
      <el-row :gutter="16">
        <el-col :span="8">
          <div class="page-card">
            <h3 style="margin-bottom: 12px">章节目录</h3>
            <el-menu :default-active="String(activeChapter?.chapter_id)">
              <el-menu-item
                v-for="ch in course.chapters"
                :key="ch.chapter_id"
                :index="String(ch.chapter_id)"
                @click="activeChapter = ch"
              >
                <span>{{ ch.title }}</span>
                <el-tag v-if="ch.completed" size="small" type="success" style="margin-left: 8px">已完成</el-tag>
              </el-menu-item>
            </el-menu>
          </div>
        </el-col>
        <el-col :span="16">
          <div v-if="activeChapter" class="page-card">
            <h3>{{ activeChapter.title }}</h3>
            <p style="color: #909399; margin: 8px 0">预计 {{ activeChapter.duration_min }} 分钟</p>
            <div class="markdown-body">{{ activeChapter.content }}</div>
            <el-button
              v-if="!activeChapter.completed"
              type="primary"
              style="margin-top: 16px"
              @click="markComplete(activeChapter)"
            >标记完成</el-button>
            <el-tag v-else type="success" style="margin-top: 16px">已完成</el-tag>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped>
.video-box {
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}
.video-box__player {
  width: 100%;
  max-height: 360px;
  display: block;
}
</style>
