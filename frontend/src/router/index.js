import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/auth/AuthEntryView.vue'), meta: { public: true } },
  { path: '/register', redirect: { path: '/login', query: { tab: 'reset' } } },
  { path: '/forgot-password', redirect: { path: '/login', query: { tab: 'reset' } } },
  { path: '/reset-password', redirect: { path: '/login', query: { tab: 'reset' } } },
  {
    path: '/',
    component: () => import('@/components/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/DashboardView.vue'), meta: { title: '首页仪表盘' } },
      { path: 'profile', name: 'Profile', component: () => import('@/views/ProfileView.vue'), meta: { title: '个人中心' } },
      { path: 'assessment', name: 'Assessment', component: () => import('@/views/AssessmentView.vue'), meta: { title: '考核系统' } },
      { path: 'teams', name: 'Teams', component: () => import('@/views/TeamsView.vue'), meta: { title: '我的团队' } },
      { path: 'teams/overview', name: 'TeamOverview', component: () => import('@/views/TeamOverviewView.vue'), meta: { title: '项目团队总览' } },
      { path: 'teams/:id', name: 'TeamDetail', component: () => import('@/views/TeamDetailView.vue'), meta: { title: '团队详情' } },
      { path: 'courses', name: 'Courses', component: () => import('@/views/CoursesView.vue'), meta: { title: '课程学习' } },
      { path: 'courses/:id', name: 'CourseDetail', component: () => import('@/views/CourseDetailView.vue'), meta: { title: '课程详情' } },
      { path: 'admin/accounts', name: 'AdminAccounts', component: () => import('@/views/admin/AccountsView.vue'), meta: { title: '账号管理', roles: ['admin'] } },
      { path: 'admin/password-resets', name: 'AdminPasswordResets', component: () => import('@/views/admin/PasswordResetsView.vue'), meta: { title: '密码找回审核', roles: ['admin'] } },
      { path: 'admin/users', redirect: '/admin/accounts' },
      { path: 'admin/announcements', name: 'AdminAnnouncements', component: () => import('@/views/admin/AnnouncementsView.vue'), meta: { title: '公告管理', roles: ['admin'] } },
      { path: 'admin/teams', name: 'AdminTeams', component: () => import('@/views/admin/TeamsView.vue'), meta: { title: '团队管理', roles: ['admin'] } },
      { path: 'admin/assessments', name: 'AdminAssessments', component: () => import('@/views/admin/AssessmentsView.vue'), meta: { title: '考核管理', roles: ['admin'] } },
      { path: 'admin/courses', name: 'AdminCourses', component: () => import('@/views/admin/CoursesView.vue'), meta: { title: '课程管理', roles: ['admin'] } },
      { path: 'admin/clock-in', name: 'AdminClockIn', component: () => import('@/views/admin/ClockInView.vue'), meta: { title: '打卡详情', roles: ['admin'] } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  if (!to.meta.public && !userStore.isLoggedIn) {
    return '/login'
  }
  if (to.meta.roles && !to.meta.roles.includes(userStore.user?.role)) {
    return '/dashboard'
  }
  if (to.meta.public && userStore.isLoggedIn && to.name === 'Login') {
    return '/dashboard'
  }
})

export default router
