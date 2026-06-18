<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { VideoPlay } from '@element-plus/icons-vue'
import { getDemoVideos, getCourses } from '@/api'
import { videoPlayUrl, isMp4Url } from '@/utils/videoUrl'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const demoVideos = ref([])
const courseVideos = ref([])
const activeId = ref('')
const activePlayUrl = ref('')
const activeTitle = ref('')

const playlist = computed(() => {
  const demos = demoVideos.value.map((v) => ({
    id: v.id,
    title: v.title,
    url: v.url,
    video_url: v.url,
    type: 'demo',
    available: !!v.url && isMp4Url(v.url),
    subtitle: v.preparing ? '正在转码为 MP4…' : v.url ? '演示视频 (MP4)' : '请先运行 npm run prepare-videos',
  }))
  const courses = courseVideos.value
    .filter((c) => isMp4Url(c.video_url))
    .map((c) => ({
      id: `course-${c.course_id}`,
      title: c.title,
      url: c.video_url,
      video_url: c.video_url,
      type: 'course',
      available: true,
      subtitle: c.category,
    }))
  return [...demos, ...courses]
})

onMounted(async () => {
  loading.value = true
  try {
    const [demoRes, courseRes] = await Promise.all([getDemoVideos(), getCourses()])
    demoVideos.value = demoRes.data
    courseVideos.value = courseRes.data
    const queryId = route.query.v
    const queryUrl = route.query.url
    if (queryUrl && isMp4Url(String(queryUrl))) {
      selectByUrl(decodeURIComponent(String(queryUrl)), String(route.query.title || '课程视频'))
    } else if (queryId) {
      selectVideo(String(queryId))
    } else {
      const first = playlist.value.find((p) => p.available)
      if (first) selectVideo(first.id)
    }
  } finally {
    loading.value = false
  }
})

watch(playlist, (list) => {
  if (!activeId.value && list.length) {
    const first = list.find((p) => p.available)
    if (first) selectVideo(first.id)
  }
})

function selectByUrl(url, title) {
  const playUrl = videoPlayUrl({ url, video_url: url })
  if (!playUrl) {
    ElMessage.warning('仅支持 MP4 格式视频')
    return
  }
  activePlayUrl.value = playUrl
  activeTitle.value = title
  activeId.value = 'custom'
}

function selectVideo(id) {
  const item = playlist.value.find((p) => p.id === id)
  if (!item) return
  if (!item.available) {
    ElMessage.warning('视频尚未就绪，请在 backend 目录运行 npm run prepare-videos 将演示视频转为 MP4')
    return
  }
  const playUrl = videoPlayUrl(item)
  if (!playUrl) return
  activeId.value = item.id
  activePlayUrl.value = playUrl
  activeTitle.value = item.title
  router.replace({ query: { v: item.id } })
}

function onVideoError() {
  ElMessage.error('视频加载失败，请确认后端已启动且 MP4 文件存在于 uploads/videos/')
}
</script>

<template>
  <div v-loading="loading" class="video-page">
    <el-page-header @back="router.push('/courses')">
      <template #content>课程视频学习</template>
    </el-page-header>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="8">
        <div class="page-card playlist">
          <h3 class="playlist__title">视频列表</h3>
          <p class="playlist__hint">站点仅支持 MP4 格式播放</p>
          <div
            v-for="item in playlist"
            :key="item.id"
            class="playlist__item"
            :class="{ 'is-active': activeId === item.id, 'is-disabled': !item.available }"
            @click="selectVideo(item.id)"
          >
            <el-icon class="playlist__icon"><VideoPlay /></el-icon>
            <div class="playlist__meta">
              <div class="playlist__name">{{ item.title }}</div>
              <div class="playlist__sub">{{ item.subtitle }}</div>
            </div>
            <el-tag v-if="item.type === 'demo'" size="small" type="info">演示</el-tag>
            <el-tag v-else size="small" type="success">课程</el-tag>
          </div>
          <el-empty v-if="!playlist.length" description="暂无 MP4 视频" />
        </div>
      </el-col>
      <el-col :span="16">
        <div class="page-card player-card">
          <h3 class="player-card__title">{{ activeTitle || '请选择视频' }}</h3>
          <div v-if="activePlayUrl" class="player-wrap">
            <video
              :key="activePlayUrl"
              class="player-wrap__video"
              controls
              controlsList="nodownload"
              :src="activePlayUrl"
              @error="onVideoError"
            >
              您的浏览器不支持视频播放。
            </video>
          </div>
          <el-empty v-else description="请从左侧选择要播放的 MP4 视频" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.playlist__title {
  margin: 0 0 4px;
  font-size: 16px;
}
.playlist__hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: #909399;
}
.playlist__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.2s;
}
.playlist__item:hover:not(.is-disabled) {
  background: #f5f7fa;
}
.playlist__item.is-active {
  background: #ecf5ff;
  border-color: #409eff;
}
.playlist__item.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.playlist__icon {
  font-size: 22px;
  color: #409eff;
}
.playlist__meta {
  flex: 1;
  min-width: 0;
}
.playlist__name {
  font-weight: 500;
  font-size: 14px;
}
.playlist__sub {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
.player-card__title {
  margin: 0 0 12px;
}
.player-wrap {
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}
.player-wrap__video {
  width: 100%;
  max-height: 480px;
  display: block;
}
</style>
