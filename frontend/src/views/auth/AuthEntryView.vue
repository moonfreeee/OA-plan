<script setup>
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Key } from '@element-plus/icons-vue'
import AuthShell from '@/components/auth/AuthShell.vue'
import { login, requestPasswordReset } from '@/api'
import { useUserStore } from '@/stores/user'
import { USE_MOCK } from '@/api/request'

const REMEMBER_KEY = 'sdo_remember_account'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('login')
const loginLoading = ref(false)
const resetLoading = ref(false)
const resetSuccess = ref(false)
const showPassword = ref(false)
const showResetPassword = ref(false)

const loginForm = reactive({ account: '', password: '', remember: false })
const resetForm = reactive({ account: '', new_password: '', confirm_password: '' })

onMounted(() => {
  if (route.query.tab === 'reset') activeTab.value = 'reset'
  const remembered = localStorage.getItem(REMEMBER_KEY)
  if (remembered) {
    loginForm.account = remembered
    loginForm.remember = true
  }
})

watch(activeTab, (tab) => {
  router.replace({ path: '/login', query: tab === 'reset' ? { tab: 'reset' } : {} })
})

function switchTab(tab) {
  activeTab.value = tab
  resetSuccess.value = false
}

async function handleLogin() {
  if (!loginForm.account || !loginForm.password) {
    ElMessage.warning('请填写账号和密码')
    return
  }
  loginLoading.value = true
  try {
    const res = await login({ account: loginForm.account, password: loginForm.password })
    if (loginForm.remember) {
      localStorage.setItem(REMEMBER_KEY, loginForm.account)
    } else {
      localStorage.removeItem(REMEMBER_KEY)
    }
    userStore.setAuth(res.data.token, res.data.user)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } finally {
    loginLoading.value = false
  }
}

async function handleResetRequest() {
  if (!resetForm.account) return ElMessage.warning('请输入账号')
  if (!resetForm.new_password || resetForm.new_password.length < 6) {
    return ElMessage.warning('新密码至少 6 位')
  }
  if (resetForm.new_password !== resetForm.confirm_password) {
    return ElMessage.warning('两次密码不一致')
  }
  resetLoading.value = true
  try {
    await requestPasswordReset({
      account: resetForm.account,
      new_password: resetForm.new_password,
      confirm_password: resetForm.confirm_password
    })
    resetSuccess.value = true
    resetForm.account = resetForm.new_password = resetForm.confirm_password = ''
  } finally {
    resetLoading.value = false
  }
}
</script>

<template>
  <AuthShell>
    <div class="auth-card">
      <nav class="auth-card__nav">
        <div class="auth-card__nav-slider" :class="{ 'is-reset': activeTab === 'reset' }" />
        <div
          class="auth-card__nav-item"
          :class="{ 'is-active': activeTab === 'login' }"
          @click="switchTab('login')"
        >
          <div>
            <div class="auth-card__nav-item-title">用户登录</div>
            <div class="auth-card__nav-item-sub">登录管理系统</div>
          </div>
          <el-icon class="auth-card__nav-icon"><User /></el-icon>
        </div>
        <div
          class="auth-card__nav-item"
          :class="{ 'is-active': activeTab === 'reset' }"
          @click="switchTab('reset')"
        >
          <div>
            <div class="auth-card__nav-item-title">密码找回</div>
            <div class="auth-card__nav-item-sub">提交管理员审核</div>
          </div>
          <el-icon class="auth-card__nav-icon"><Key /></el-icon>
        </div>
      </nav>

      <div class="auth-card__body">
        <div class="auth-panel-wrap">
          <div class="auth-panel" :class="activeTab === 'login' ? 'is-visible' : 'is-hidden'">
            <h1 class="auth-title">用户登录</h1>
            <form @submit.prevent="handleLogin">
              <div class="auth-field">
                <input
                  v-model="loginForm.account"
                  class="auth-input"
                  placeholder="请输入账号"
                  autocomplete="username"
                />
              </div>
              <div class="auth-field auth-field--password">
                <input
                  v-model="loginForm.password"
                  class="auth-input"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入密码"
                  autocomplete="current-password"
                />
                <button type="button" class="auth-eye" @click="showPassword = !showPassword">
                  {{ showPassword ? '🙈' : '👁' }}
                </button>
              </div>
              <div class="auth-row-between">
                <label class="auth-checkbox">
                  <input v-model="loginForm.remember" type="checkbox" />
                  <span>记住密码</span>
                </label>
              </div>
              <button type="submit" class="auth-btn-primary" :disabled="loginLoading">
                {{ loginLoading ? '登录中…' : '登录' }}
              </button>
            </form>
            <div v-if="USE_MOCK" class="auth-mock-tip">
              演示账号：admin / Admin@123 或 member1 / Member@123
            </div>
          </div>

          <div class="auth-panel" :class="activeTab === 'reset' ? 'is-visible' : 'is-hidden'">
            <template v-if="resetSuccess">
              <div class="auth-success">
                <div class="auth-success__icon">✓</div>
                <div class="auth-success__text">申请已提交</div>
                <p class="auth-muted" style="margin-top: 12px">请等待管理员审核，通过后可使用新密码登录</p>
                <button type="button" class="auth-btn-primary" style="margin-top: 20px" @click="switchTab('login')">
                  返回登录
                </button>
              </div>
            </template>
            <template v-else>
              <h1 class="auth-title">密码找回</h1>
              <p class="auth-subtitle">提交申请后由管理员审核通过即可生效</p>
              <form @submit.prevent="handleResetRequest">
                <div class="auth-field">
                  <input v-model="resetForm.account" class="auth-input" placeholder="请输入登录账号" />
                </div>
                <div class="auth-field auth-field--password">
                  <input
                    v-model="resetForm.new_password"
                    class="auth-input"
                    :type="showResetPassword ? 'text' : 'password'"
                    placeholder="请输入新密码"
                  />
                  <button type="button" class="auth-eye" @click="showResetPassword = !showResetPassword">
                    {{ showResetPassword ? '🙈' : '👁' }}
                  </button>
                </div>
                <div class="auth-field">
                  <input
                    v-model="resetForm.confirm_password"
                    class="auth-input"
                    type="password"
                    placeholder="请再次输入新密码"
                  />
                </div>
                <button type="submit" class="auth-btn-primary" :disabled="resetLoading">
                  {{ resetLoading ? '提交中…' : '提交申请' }}
                </button>
              </form>
            </template>
          </div>
        </div>
      </div>
    </div>
  </AuthShell>
</template>

<style scoped>
@import '@/styles/auth.css';
</style>
