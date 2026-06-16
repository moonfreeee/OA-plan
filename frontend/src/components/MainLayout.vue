<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import UserAvatar from '@/components/UserAvatar.vue'
import {
  HomeFilled,
  User,
  Grid,
  UserFilled,
  Reading,
  Setting,
  ArrowDown
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const showUserMenu = ref(false)

const navItems = [
  { path: '/dashboard', label: '首页', icon: HomeFilled },
  { path: '/profile', label: '个人中心', icon: User },
  { path: '/assessment', label: '考核系统', icon: Grid },
  { path: '/teams', label: '我的团队', icon: UserFilled },
  { path: '/courses', label: '课程学习', icon: Reading }
]

const adminItems = [
  { path: '/admin/users', label: '用户审核' },
  { path: '/admin/announcements', label: '公告管理' },
  { path: '/admin/teams', label: '团队管理' },
  { path: '/admin/assessments', label: '考核管理' },
  { path: '/admin/courses', label: '课程管理' }
]

const activeMenu = computed(() => {
  if (route.path.startsWith('/teams')) return '/teams'
  if (route.path.startsWith('/courses')) return '/courses'
  if (route.path.startsWith('/admin')) return route.path
  return route.path
})

function isActive(path) {
  if (path === '/dashboard') return activeMenu.value === '/dashboard'
  if (path.startsWith('/admin')) return activeMenu.value === path
  return activeMenu.value === path || (path !== '/dashboard' && route.path.startsWith(path))
}

function handleLogout() {
  showUserMenu.value = false
  userStore.logout()
  router.push('/login')
}

function closeMenu() {
  showUserMenu.value = false
}

const displayName = computed(() => userStore.user?.real_name || userStore.user?.username || '用户')
const roleLabel = computed(() => (userStore.user?.role === 'admin' ? '管理员' : '成员'))
const pageTitle = computed(() => route.meta.title || '')
</script>

<template>
  <div class="app-layout" @click="closeMenu">
    <aside class="sidebar">
      <div class="sidebar__brand">软开办公室管理系统</div>
      <nav class="sidebar__nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="sidebar__item"
          :class="{ 'is-active': isActive(item.path) }"
        >
          <el-icon class="sidebar__icon"><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </router-link>
        <template v-if="userStore.isAdmin">
          <div class="sidebar__divider" />
          <router-link
            v-for="item in adminItems"
            :key="item.path"
            :to="item.path"
            class="sidebar__item sidebar__item--sub"
            :class="{ 'is-active': isActive(item.path) }"
          >
            <el-icon class="sidebar__icon"><Setting /></el-icon>
            <span>{{ item.label }}</span>
          </router-link>
        </template>
      </nav>
    </aside>

    <div class="main-area">
      <header class="main-header">
        <h1 v-if="pageTitle" class="main-header__title">{{ pageTitle }}</h1>
        <div v-else class="main-header__spacer" />
        <div class="main-header__user" @click.stop="showUserMenu = !showUserMenu">
          <UserAvatar :user="userStore.user" :size="36" />
          <div class="main-header__info">
            <span class="main-header__role">{{ roleLabel }}</span>
            <span class="main-header__name">{{ displayName }}</span>
          </div>
          <el-icon class="main-header__arrow"><ArrowDown /></el-icon>
          <transition name="fade">
            <div v-if="showUserMenu" class="user-dropdown" @click.stop>
              <button type="button" class="user-dropdown__item" @click="handleLogout">退出登录</button>
            </div>
          </transition>
        </div>
      </header>
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  font-family: 'Source Han Sans SC', 'Noto Sans SC', '思源黑体', 'Microsoft YaHei', sans-serif;
}

.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #474545;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.sidebar__brand {
  padding: 24px 16px 20px;
  font-family: 'Kingsoft Cloud Font', 'Alimama ShuHeiTi', 'Microsoft YaHei', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #2267f2;
  line-height: 1.4;
  text-align: center;
}

.sidebar__nav {
  flex: 1;
  padding: 8px 12px;
}

.sidebar__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  margin-bottom: 4px;
  border-radius: 6px;
  color: #ebe4e4;
  text-decoration: none;
  font-size: 15px;
  transition: background 0.2s, color 0.2s;
}

.sidebar__item:hover {
  color: #fff;
}

.sidebar__item.is-active {
  background: #cccccc;
  color: #2267f2;
}

.sidebar__item.is-active .sidebar__icon {
  color: #2267f2;
}

.sidebar__icon {
  font-size: 18px;
  color: inherit;
}

.sidebar__divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
  margin: 12px 8px;
}

.sidebar__item--sub {
  font-size: 14px;
  padding: 12px 16px;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  min-width: 0;
}

.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px 10px;
  background: #f5f5f5;
  flex-shrink: 0;
}

.main-header__title {
  font-family: 'Kingsoft Cloud Font', 'Alimama ShuHeiTi', 'Microsoft YaHei', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.2;
}

.main-header__spacer {
  flex: 1;
}

.main-header__user {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.main-header__user:hover {
  background: rgba(0, 0, 0, 0.04);
}

.main-header__info {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.main-header__role {
  font-size: 12px;
  color: #b8b8b8;
}

.main-header__name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.main-header__arrow {
  font-size: 12px;
  color: #999;
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 120px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 100;
}

.user-dropdown__item {
  width: 100%;
  border: none;
  background: none;
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  font-family: inherit;
}

.user-dropdown__item:hover {
  background: #f5f7fa;
  color: #2267f2;
}

.main-content {
  flex: 1;
  padding: 4px 24px 20px;
  overflow: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
