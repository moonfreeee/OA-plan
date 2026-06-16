<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AuthShell from '@/components/auth/AuthShell.vue'
import { confirmResetPassword } from '@/api'

const RESET_SESSION_KEY = 'sdo_reset_session'

const router = useRouter()
const loading = ref(false)
const session = ref(null)

const form = reactive({ new_password: '', confirm: '' })

onMounted(() => {
  const raw = sessionStorage.getItem(RESET_SESSION_KEY)
  if (!raw) {
    ElMessage.warning('请先完成邮箱验证')
    router.replace('/forgot-password')
    return
  }
  try {
    session.value = JSON.parse(raw)
  } catch {
    router.replace('/forgot-password')
  }
})

async function handleReset() {
  if (!form.new_password || !form.confirm) {
    ElMessage.warning('请填写新密码')
    return
  }
  if (form.new_password !== form.confirm) {
    ElMessage.warning('两次密码不一致')
    return
  }
  loading.value = true
  try {
    await confirmResetPassword({
      email: session.value.email,
      new_password: form.new_password
    })
    sessionStorage.removeItem(RESET_SESSION_KEY)
    ElMessage.success('密码重置成功，请登录')
    router.push('/login')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell>
    <div v-if="session" class="auth-card auth-card--single">
      <h1 class="auth-title">密 码 重 置</h1>
      <form @submit.prevent="handleReset">
        <div class="auth-field">
          <input
            v-model="form.new_password"
            class="auth-input"
            type="password"
            placeholder="请输入新密码"
          />
        </div>
        <div class="auth-field">
          <input
            v-model="form.confirm"
            class="auth-input"
            type="password"
            placeholder="请确认新密码"
          />
        </div>
        <button type="submit" class="auth-btn-primary" :disabled="loading">
          {{ loading ? '提交中…' : '确认重置' }}
        </button>
      </form>
      <router-link to="/login" class="auth-back">返回登录</router-link>
    </div>
  </AuthShell>
</template>

<style scoped>
@import '@/styles/auth.css';
</style>
