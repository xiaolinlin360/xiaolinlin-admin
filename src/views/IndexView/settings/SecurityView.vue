<template>
  <div class="security-page">
    <HeadTitle :title="'密码与绑定'" />

    <div v-loading="loading" class="page-body">
      <div class="security-card">
        <div class="card-title">修改密码</div>

        <!-- 三种验证方式 -->
        <el-radio-group v-model="mode" class="mode-group">
          <el-radio-button value="old">原密码</el-radio-button>
          <el-radio-button value="email" :disabled="!profile.email">邮箱验证码</el-radio-button>
          <el-radio-button value="phone" :disabled="!profile.phone">手机验证码</el-radio-button>
        </el-radio-group>

        <p class="mode-tip">{{ modeTip }}</p>

        <el-form :model="form" label-width="90px">
          <el-form-item v-if="mode === 'old'" label="原密码">
            <el-input
              v-model="form.oldPassword"
              type="password"
              show-password
              placeholder="请输入当前密码" />
          </el-form-item>

          <el-form-item v-else label="验证码">
            <div class="code-row">
              <el-input v-model="form.code" maxlength="6" placeholder="6 位验证码" />
              <el-button :disabled="countdown > 0" :loading="sending" @click="handleSendCode">
                {{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>

          <el-form-item label="新密码">
            <el-input
              v-model="form.newPassword"
              type="password"
              show-password
              placeholder="至少 6 位" />
          </el-form-item>

          <el-form-item label="确认密码">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              show-password
              placeholder="再输一次" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">
              确认修改
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import HeadTitle from '@/components/bar/HeadTitle.vue'
import {
  getProfile,
  updatePassword,
  sendCode,
  resetPasswordByCode,
  type CodeChannel,
} from '@/api/users'

const loading = ref(false)
const sending = ref(false)
const submitting = ref(false)
const countdown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

// old = 用原密码；email / phone = 用验证码
const mode = ref<'old' | CodeChannel>('old')
const profile = ref<{ email: string | null; phone: string | null }>({ email: null, phone: null })
const form = ref({ oldPassword: '', code: '', newPassword: '', confirmPassword: '' })

const modeTip = computed(() => {
  if (mode.value === 'old') return '输入当前密码即可修改'
  if (mode.value === 'email') return `验证码会发到你的邮箱：${profile.value.email}`
  return `验证码会发到你的手机：${profile.value.phone}`
})

const loadProfile = async () => {
  loading.value = true
  try {
    const res = await getProfile()
    profile.value = { email: res.data.email, phone: res.data.phone }
  } finally {
    loading.value = false
  }
}

// 发验证码 + 60 秒倒计时，防止连点
const handleSendCode = async () => {
  sending.value = true
  try {
    const res = await sendCode(mode.value as CodeChannel)
    ElMessage.success(`验证码已发送到 ${res.data.target}`)

    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0 && timer) {
        clearInterval(timer)
        timer = null
      }
    }, 1000)
  } finally {
    sending.value = false
  }
}

const handleSubmit = async () => {
  const { oldPassword, code, newPassword, confirmPassword } = form.value

  if (mode.value === 'old' && !oldPassword) {
    ElMessage.warning('请输入原密码')
    return
  }
  if (mode.value !== 'old' && !code) {
    ElMessage.warning('请输入验证码')
    return
  }
  if (newPassword.length < 6) {
    ElMessage.warning('新密码至少 6 位')
    return
  }
  if (newPassword !== confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }

  submitting.value = true
  try {
    if (mode.value === 'old') {
      await updatePassword({ oldPassword, newPassword })
    } else {
      await resetPasswordByCode({ channel: mode.value, code, newPassword })
    }

    ElMessage.success('密码已修改，下次登录请用新密码')
    form.value = { oldPassword: '', code: '', newPassword: '', confirmPassword: '' }
  } finally {
    submitting.value = false
  }
}

onMounted(loadProfile)

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped lang="scss">
.security-page {
  background-color: $my-bg-page;
  min-height: 100%;
}

.page-body {
  padding: 20px;
}

.security-card {
  max-width: 560px;
  padding: 24px;
  border-radius: 8px;
  background-color: $my-bg-card;
  border: 1px solid $my-border-color;
  box-shadow: 0 2px 8px $my-shadow-color;

  .card-title {
    margin-bottom: 20px;
    font-size: 15px;
    font-weight: 600;
    color: $my-text-main;
  }
}

.mode-group {
  margin-bottom: 8px;
}

.mode-tip {
  margin: 0 0 20px;
  font-size: 12px;
  color: $my-text-sub;
}

.code-row {
  display: flex;
  gap: 12px;
  width: 100%;

  .el-input {
    flex: 1;
  }
}
</style>
