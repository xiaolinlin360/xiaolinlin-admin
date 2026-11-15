<template>
  <div class="security-page">
    <HeadTitle :title="'密码与绑定'" />

    <div v-loading="loading" class="page-body">
      <!-- 一、修改密码 -->
      <div class="security-card">
        <div class="card-title">修改密码</div>

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
              <el-button
                :disabled="pwdCountdown.seconds.value > 0"
                :loading="sending"
                @click="handleSendCode">
                {{
                  pwdCountdown.seconds.value > 0
                    ? `${pwdCountdown.seconds.value}s 后重发`
                    : '获取验证码'
                }}
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

      <!-- 二、更换邮箱 / 手机号 -->
      <div class="security-card">
        <div class="card-title">更换邮箱 / 手机号</div>

        <el-radio-group v-model="contact.channel" class="mode-group">
          <el-radio-button value="email">换邮箱</el-radio-button>
          <el-radio-button value="phone">换手机号</el-radio-button>
        </el-radio-group>

        <p class="mode-tip">
          当前邮箱：{{ profile.email || '未绑定' }}　|　当前手机：{{ profile.phone || '未绑定' }}
        </p>

        <el-form label-width="90px">
          <el-form-item :label="contact.channel === 'email' ? '新邮箱' : '新手机号'">
            <el-input
              v-model="contact.target"
              :placeholder="
                contact.channel === 'email' ? 'name@example.com' : '86 + 11 位，如 8613800138000'
              " />
          </el-form-item>

          <el-form-item label="验证码">
            <div class="code-row">
              <el-input v-model="contact.code" maxlength="6" placeholder="6 位验证码" />
              <el-button
                :disabled="contactCountdown.seconds.value > 0"
                :loading="sendingContact"
                @click="handleSendContactCode">
                {{
                  contactCountdown.seconds.value > 0
                    ? `${contactCountdown.seconds.value}s 后重发`
                    : '获取验证码'
                }}
              </el-button>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="savingContact" @click="handleUpdateContact">
              确认更换
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import HeadTitle from '@/components/bar/HeadTitle.vue'
import {
  getProfile,
  updatePassword,
  sendCode,
  resetPasswordByCode,
  sendContactCode,
  updateContact,
  type CodeChannel,
} from '@/api/users'
import { useUserStore } from '@/stores/index'

/** 倒计时小工具：发完验证码后 60 秒内不让再点 */
const useCountdown = () => {
  const seconds = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  const start = () => {
    seconds.value = 60
    timer = setInterval(() => {
      seconds.value--
      if (seconds.value <= 0 && timer) {
        clearInterval(timer)
        timer = null
      }
    }, 1000)
  }

  const stop = () => {
    if (timer) clearInterval(timer)
    timer = null
  }

  return { seconds, start, stop }
}

const userStore = useUserStore()
const pwdCountdown = useCountdown()
const contactCountdown = useCountdown()

const loading = ref(false)
const sending = ref(false)
const submitting = ref(false)
const sendingContact = ref(false)
const savingContact = ref(false)

const profile = ref<{ email: string | null; phone: string | null }>({ email: null, phone: null })

// 一、修改密码
const mode = ref<'old' | CodeChannel>('old')
const form = ref({ oldPassword: '', code: '', newPassword: '', confirmPassword: '' })

// 二、更换绑定
const contact = ref<{ channel: CodeChannel; target: string; code: string }>({
  channel: 'email',
  target: '',
  code: '',
})

// 换邮箱/换手机号时清空输入，避免把邮箱的码拿去绑手机
watch(
  () => contact.value.channel,
  () => {
    contact.value.target = ''
    contact.value.code = ''
  }
)

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

// ---------- 一、修改密码 ----------

const handleSendCode = async () => {
  sending.value = true
  try {
    const res = await sendCode(mode.value as CodeChannel)
    ElMessage.success(`验证码已发送到 ${res.data.target}`)
    pwdCountdown.start()
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

// ---------- 二、更换绑定 ----------

const handleSendContactCode = async () => {
  const target = contact.value.target.trim()
  if (!target) {
    ElMessage.warning(contact.value.channel === 'email' ? '请输入新邮箱' : '请输入新手机号')
    return
  }

  sendingContact.value = true
  try {
    const res = await sendContactCode({ channel: contact.value.channel, target })
    ElMessage.success(`验证码已发送到 ${res.data.target}`)
    contactCountdown.start()
  } finally {
    sendingContact.value = false
  }
}

const handleUpdateContact = async () => {
  const target = contact.value.target.trim()

  if (!target) {
    ElMessage.warning(contact.value.channel === 'email' ? '请输入新邮箱' : '请输入新手机号')
    return
  }
  if (!contact.value.code) {
    ElMessage.warning('请输入验证码')
    return
  }

  savingContact.value = true
  try {
    const res = await updateContact({
      channel: contact.value.channel,
      target,
      code: contact.value.code,
    })
    ElMessage.success(contact.value.channel === 'email' ? '邮箱已更换' : '手机号已更换')

    profile.value = { email: res.data.email, phone: res.data.phone }
    userStore.setUserData({ ...userStore.userData, email: res.data.email, phone: res.data.phone })

    contact.value.target = ''
    contact.value.code = ''
  } finally {
    savingContact.value = false
  }
}

onMounted(loadProfile)

onBeforeUnmount(() => {
  pwdCountdown.stop()
  contactCountdown.stop()
})
</script>

<style scoped lang="scss">
.security-page {
  background-color: $my-bg-page;
  min-height: 100%;
}

.page-body {
  padding: 20px;
  display: flex;
  // flex-direction: column;
  justify-content: space-between;
  gap: 20px;
}
.page-body > * {
  flex: 1 1 50%;
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
