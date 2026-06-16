<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCourse, completeChapter } from '@/api'

const route = useRoute()
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
</script>

<template>
  <div v-loading="loading">
    <el-page-header @back="$router.push('/courses')">
      <template #content>{{ course?.title || '课程详情' }}</template>
    </el-page-header>

    <div v-if="course" style="margin-top: 16px">
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
