<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Promotion } from '@element-plus/icons-vue'
import AuthShell from '@/components/auth/AuthShell.vue'
import { login, register, sendEmailCode } from '@/api'
import { useUserStore } from '@/stores/user'
import { USE_MOCK } from '@/api/request'
import { MOCK_VERIFY_CODE } from '@/constants/auth'

const REMEMBER_KEY = 'sdo_remember_account'
const PREFILL_KEY = 'sdo_login_prefill'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('login')
const loginLoading = ref(false)
const registerLoading = ref(false)
const registerSuccess = ref(false)
const showPassword = ref(false)

const loginForm = reactive({ account: '', password: '', remember: false })
const registerForm = reactive({
  username: '',
  password: '',
  confirm: '',
  emailPrefix: '',
  emailSuffix: '@gmail.com',
  code: '',
  real_name: '',
  student_no: ''
})

const codeCountdown = ref(0)
let codeTimer = null

const emailDomains = ['@gmail.com', '@qq.com', '@163.com', '@outlook.com', '@sdo.local']

const fullEmail = computed(() =>
  registerForm.emailPrefix ? `${registerForm.emailPrefix}${registerForm.emailSuffix}` : ''
)

onMounted(() => {
  if (route.query.tab === 'register') activeTab.value = 'register'
  const remembered = localStorage.getItem(REMEMBER_KEY)
  if (remembered) {
    loginForm.account = remembered
    loginForm.remember = true
  }
  const prefill = sessionStorage.getItem(PREFILL_KEY)
  if (prefill) {
    try {
      const { account, password } = JSON.parse(prefill)
      loginForm.account = account
      loginForm.password = password
      activeTab.value = 'login'
      sessionStorage.removeItem(PREFILL_KEY)
    } catch { /* ignore */ }
  }
})

onUnmounted(() => {
  if (codeTimer) clearInterval(codeTimer)
})

watch(activeTab, (tab) => {
  router.replace({ path: '/login', query: tab === 'register' ? { tab: 'register' } : {} })
})

function switchTab(tab) {
  activeTab.value = tab
  registerSuccess.value = false
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

function startCountdown() {
  codeCountdown.value = 60
  if (codeTimer) clearInterval(codeTimer)
  codeTimer = setInterval(() => {
    codeCountdown.value -= 1
    if (codeCountdown.value <= 0) clearInterval(codeTimer)
  }, 1000)
}

async function sendRegisterCode() {
  if (!registerForm.emailPrefix) {
    ElMessage.warning('请先填写邮箱')
    return
  }
  await sendEmailCode({ email: fullEmail.value, type: 'register' })
  ElMessage.success('验证码已发送')
  startCountdown()
}

async function handleRegister() {
  if (!registerForm.username || !registerForm.password) {
    ElMessage.warning('请填写用户名和密码')
    return
  }
  if (registerForm.password !== registerForm.confirm) {
    ElMessage.warning('两次密码不一致')
    return
  }
  if (!registerForm.emailPrefix) {
    ElMessage.warning('请填写绑定邮箱')
    return
  }
  if (!registerForm.code) {
    ElMessage.warning('请输入验证码')
    return
  }
  registerLoading.value = true
  try {
    await register({
      username: registerForm.username,
      email: fullEmail.value,
      password: registerForm.password,
      real_name: registerForm.real_name || registerForm.username,
      student_no: registerForm.student_no,
      code: registerForm.code
    })
    registerSuccess.value = true
    setTimeout(() => {
      sessionStorage.setItem(
        PREFILL_KEY,
        JSON.stringify({ account: registerForm.username, password: registerForm.password })
      )
      registerSuccess.value = false
      activeTab.value = 'login'
      registerForm.username = registerForm.password = registerForm.confirm = ''
      registerForm.emailPrefix = registerForm.code = ''
    }, 2000)
  } finally {
    registerLoading.value = false
  }
}
</script>

<template>
  <AuthShell>
    <div class="auth-card">
      <nav class="auth-card__nav">
        <div class="auth-card__nav-slider" :class="{ 'is-register': activeTab === 'register' }" />
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
          :class="{ 'is-active': activeTab === 'register' }"
          @click="switchTab('register')"
        >
          <div class="auth-card__nav-item-title">新注册</div>
          <el-icon class="auth-card__nav-icon"><Promotion /></el-icon>
        </div>
      </nav>

      <div class="auth-card__body">
        <div class="auth-panel-wrap">
          <!-- 登录 -->
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
                <router-link to="/forgot-password" class="auth-link">忘记密码</router-link>
              </div>
              <button type="submit" class="auth-btn-primary" :disabled="loginLoading">
                {{ loginLoading ? '登录中…' : '登录' }}
              </button>
            </form>
            <div v-if="USE_MOCK" class="auth-mock-tip">
              演示账号：admin / Admin@123 或 member1 / Member@123
            </div>
          </div>

          <!-- 注册 -->
          <div class="auth-panel" :class="activeTab === 'register' ? 'is-visible' : 'is-hidden'">
            <template v-if="registerSuccess">
              <div class="auth-success">
                <div class="auth-success__icon">✓</div>
                <div class="auth-success__text">注册成功</div>
                <p class="auth-muted" style="margin-top: 12px">即将跳转至登录页…</p>
              </div>
            </template>
            <template v-else>
              <h1 class="auth-title">注册</h1>
              <p class="auth-subtitle">欢迎来到软开基地</p>
              <form @submit.prevent="handleRegister">
                <div class="auth-field">
                  <input v-model="registerForm.username" class="auth-input" placeholder="请输入用户名" />
                </div>
                <div class="auth-field">
                  <input
                    v-model="registerForm.password"
                    class="auth-input"
                    type="password"
                    placeholder="请输入密码"
                  />
                </div>
                <div class="auth-field">
                  <input
                    v-model="registerForm.confirm"
                    class="auth-input"
                    type="password"
                    placeholder="请再次输入密码"
                  />
                </div>
                <div class="auth-field auth-input-row">
                  <input v-model="registerForm.emailPrefix" class="auth-input" placeholder="请输入绑定邮箱" />
                  <select v-model="registerForm.emailSuffix" class="auth-email-suffix">
                    <option v-for="d in emailDomains" :key="d" :value="d">{{ d }}</option>
                  </select>
                </div>
                <div class="auth-field auth-input-row">
                  <input v-model="registerForm.code" class="auth-input" placeholder="请输入验证码" maxlength="6" />
                  <button
                    type="button"
                    class="auth-code-btn"
                    :disabled="codeCountdown > 0"
                    @click="sendRegisterCode"
                  >
                    {{ codeCountdown > 0 ? `重新发送 ${codeCountdown}s` : '获取验证码' }}
                  </button>
                </div>
                <button type="submit" class="auth-btn-primary" :disabled="registerLoading">
                  {{ registerLoading ? '提交中…' : '注册' }}
                </button>
              </form>
              <div v-if="USE_MOCK" class="auth-mock-tip">
                测试验证码：<strong>{{ MOCK_VERIFY_CODE }}</strong>（注册与找回密码通用）
              </div>
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
