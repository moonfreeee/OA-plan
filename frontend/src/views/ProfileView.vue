<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getMe, updateMe, changePassword } from '@/api'

const loading = ref(false)
const pwdLoading = ref(false)
const form = reactive({
  username: '',
  email: '',
  student_no: '',
  real_name: '',
  phone: '',
  bio: ''
})
const pwdForm = reactive({ old_password: '', new_password: '', confirm: '' })

onMounted(async () => {
  loading.value = true
  try {
    const res = await getMe()
    Object.assign(form, res.data)
  } finally {
    loading.value = false
  }
})

async function saveProfile() {
  loading.value = true
  try {
    await updateMe({
      real_name: form.real_name,
      phone: form.phone,
      bio: form.bio
    })
    ElMessage.success('保存成功')
  } finally {
    loading.value = false
  }
}

async function savePassword() {
  if (pwdForm.new_password !== pwdForm.confirm) return ElMessage.warning('两次密码不一致')
  pwdLoading.value = true
  try {
    await changePassword({ old_password: pwdForm.old_password, new_password: pwdForm.new_password })
    ElMessage.success('密码修改成功')
    pwdForm.old_password = pwdForm.new_password = pwdForm.confirm = ''
  } finally {
    pwdLoading.value = false
  }
}
</script>

<template>
  <div v-loading="loading" class="profile">
    <div class="profile__cards">
      <section class="profile-card">
        <h3 class="profile-card__title">基本信息</h3>
        <form class="profile-form" @submit.prevent="saveProfile">
          <div class="profile-form__row">
            <label class="profile-form__label">用户名</label>
            <input class="profile-form__input" :value="form.username" disabled />
          </div>
          <div class="profile-form__row">
            <label class="profile-form__label">邮箱</label>
            <input class="profile-form__input" :value="form.email" disabled />
          </div>
          <div class="profile-form__row">
            <label class="profile-form__label">工号</label>
            <input class="profile-form__input" :value="form.student_no" disabled />
          </div>
          <div class="profile-form__row">
            <label class="profile-form__label">真实姓名</label>
            <input v-model="form.real_name" class="profile-form__input" />
          </div>
          <div class="profile-form__row">
            <label class="profile-form__label">手机号</label>
            <input v-model="form.phone" class="profile-form__input" />
          </div>
          <div class="profile-form__row profile-form__row--textarea">
            <label class="profile-form__label">个人简介</label>
            <textarea v-model="form.bio" class="profile-form__textarea" rows="4" />
          </div>
          <button type="submit" class="profile-btn">保存</button>
        </form>
      </section>

      <section class="profile-card">
        <h3 class="profile-card__title">密码修改</h3>
        <form class="profile-form" @submit.prevent="savePassword">
          <div class="profile-form__row">
            <label class="profile-form__label">旧密码</label>
            <input v-model="pwdForm.old_password" type="password" class="profile-form__input" />
          </div>
          <div class="profile-form__row">
            <label class="profile-form__label">新密码</label>
            <input v-model="pwdForm.new_password" type="password" class="profile-form__input" />
          </div>
          <div class="profile-form__row">
            <label class="profile-form__label">确认新密码</label>
            <input v-model="pwdForm.confirm" type="password" class="profile-form__input" />
          </div>
          <button type="submit" class="profile-btn" :disabled="pwdLoading">重置密码</button>
        </form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.profile__cards {
  max-width: 680px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-card {
  background: #fff;
  border-radius: 10px;
  padding: 22px 28px 24px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}

.profile-card__title {
  font-family: 'Kingsoft Cloud Font', 'Alimama ShuHeiTi', 'Microsoft YaHei', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 18px;
}

.profile-form__row {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
}

.profile-form__row--textarea {
  align-items: flex-start;
}

.profile-form__row--textarea .profile-form__label {
  padding-top: 10px;
}

.profile-form__label {
  width: 88px;
  flex-shrink: 0;
  font-size: 14px;
  color: #333;
  text-align: left;
}

.profile-form__input,
.profile-form__textarea {
  flex: 1;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  color: #333;
  font-family: 'Source Han Sans SC', 'Noto Sans SC', '思源黑体', 'Microsoft YaHei', sans-serif;
  outline: none;
  background: #fff;
}

.profile-form__input:disabled {
  background: #f5f7fa;
  color: #606266;
}

.profile-form__input:focus,
.profile-form__textarea:focus {
  border-color: #2267f2;
}

.profile-form__textarea {
  resize: vertical;
  min-height: 88px;
  line-height: 1.5;
}

.profile-btn {
  margin-top: 6px;
  padding: 8px 28px;
  border: none;
  border-radius: 4px;
  background: #2267f2;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
}

.profile-btn:hover {
  background: #1a56d4;
}

.profile-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
