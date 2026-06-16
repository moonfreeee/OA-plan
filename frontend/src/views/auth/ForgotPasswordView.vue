<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AuthShell from '@/components/auth/AuthShell.vue'
import { sendEmailCode, verifyResetCode } from '@/api'
import { USE_MOCK } from '@/api/request'
import { MOCK_VERIFY_CODE } from '@/constants/auth'

const RESET_SESSION_KEY = 'sdo_reset_session'

const router = useRouter()
const step = ref(1)
const loading = ref(false)
const codeCountdown = ref(0)
let codeTimer = null

const form = reactive({
  account: '',
  emailPrefix: '',
  emailSuffix: '@gmail.com',
  code: ''
})

const emailDomains = ['@gmail.com', '@qq.com', '@163.com', '@outlook.com', '@sdo.local']

const fullEmail = computed(() =>
  form.emailPrefix ? `${form.emailPrefix}${form.emailSuffix}` : ''
)

onUnmounted(() => {
  if (codeTimer) clearInterval(codeTimer)
})

function startCountdown() {
  codeCountdown.value = 60
  if (codeTimer) clearInterval(codeTimer)
  codeTimer = setInterval(() => {
    codeCountdown.value -= 1
    if (codeCountdown.value <= 0) clearInterval(codeTimer)
  }, 1000)
}

/** 第一步：填写账号与邮箱，进入验证码步骤 */
function goToVerifyStep() {
  if (!form.account.trim()) {
    ElMessage.warning('请输入重置账号')
    return
  }
  if (!form.emailPrefix.trim()) {
    ElMessage.warning('请输入绑定邮箱')
    return
  }
  step.value = 2
}

async function sendCode() {
  if (!form.emailPrefix) return ElMessage.warning('请输入绑定邮箱')
  await sendEmailCode({ email: fullEmail.value, type: 'reset', account: form.account })
  ElMessage.success('验证码已发送')
  startCountdown()
}

async function verifyAndNext() {
  if (!form.code) {
    ElMessage.warning('请输入验证码')
    return
  }
  loading.value = true
  try {
    await verifyResetCode({
      email: fullEmail.value,
      account: form.account,
      code: form.code
    })
    sessionStorage.setItem(
      RESET_SESSION_KEY,
      JSON.stringify({ email: fullEmail.value, account: form.account })
    )
    router.push('/reset-password')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell>
    <div class="auth-card auth-card--single">
      <h1 class="auth-title">密 码 重 置</h1>

      <!-- 步骤1：账号 + 邮箱 -->
      <template v-if="step === 1">
        <div class="auth-field">
          <div class="auth-label">重置账号:</div>
          <input v-model="form.account" class="auth-input" placeholder="" />
        </div>
        <div class="auth-field">
          <div class="auth-label">绑定邮箱:</div>
          <div class="auth-input-row">
            <input v-model="form.emailPrefix" class="auth-input" placeholder="" />
            <select v-model="form.emailSuffix" class="auth-email-suffix">
              <option v-for="d in emailDomains" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>
        </div>
        <button type="button" class="auth-btn-primary" @click="goToVerifyStep">下一步</button>
      </template>

      <!-- 步骤2：验证码（填写邮箱后才显示） -->
      <template v-else>
        <div class="auth-field">
          <div class="auth-label">重置账号:</div>
          <input :value="form.account" class="auth-input" disabled />
        </div>
        <div class="auth-field">
          <div class="auth-label">绑定邮箱:</div>
          <div class="auth-input-row">
            <input :value="form.emailPrefix" class="auth-input" disabled />
            <select :value="form.emailSuffix" class="auth-email-suffix" disabled>
              <option :value="form.emailSuffix">{{ form.emailSuffix }}</option>
            </select>
          </div>
        </div>
        <div class="auth-field auth-input-row">
          <input v-model="form.code" class="auth-input" placeholder="请输入验证码" maxlength="6" />
          <button type="button" class="auth-code-btn" :disabled="codeCountdown > 0" @click="sendCode">
            {{ codeCountdown > 0 ? `重新发送 ${codeCountdown}s` : '获取验证码' }}
          </button>
        </div>
        <button type="button" class="auth-btn-primary" :disabled="loading" @click="verifyAndNext">
          {{ loading ? '验证中…' : '下一步' }}
        </button>
      </template>

      <router-link to="/login" class="auth-back">返回登录</router-link>

      <div v-if="USE_MOCK" class="auth-mock-tip">
        测试验证码：<strong>{{ MOCK_VERIFY_CODE }}</strong>
      </div>
    </div>
  </AuthShell>
</template>

<style scoped>
@import '@/styles/auth.css';

.auth-input:disabled {
  background: #f5f5f5;
  color: #666;
}
</style>
