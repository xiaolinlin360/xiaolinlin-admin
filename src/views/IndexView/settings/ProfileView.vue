<template>
  <div class="profile-page">
    <HeadTitle :title="'个人主页'" />

    <div v-loading="loading" class="page-body">
      <div class="profile-card">
        <div class="card-title">基本信息</div>

        <el-form :model="form" label-width="70px" class="profile-form">
          <el-form-item label="头像">
            <div class="avatar-box">
              <el-upload
                class="avatar-upload"
                accept="image/*"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleAvatarChange">
                <img v-if="avatarPreview" :src="avatarPreview" class="avatar-img" alt="头像" />
                <div v-else class="avatar-empty">
                  <el-icon><Plus /></el-icon>
                </div>
              </el-upload>
              <span class="avatar-tip">点击更换头像，jpg / png，不超过 5MB</span>
            </div>
          </el-form-item>

          <el-form-item label="名称">
            <el-input v-model="form.name" maxlength="20" show-word-limit placeholder="请输入名称" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">确认</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import HeadTitle from '@/components/bar/HeadTitle.vue'
import http from '@/utils/http'
import { toAbsoluteUrl } from '@/utils/asset'
import { getProfile, updateProfile } from '@/api/users'
import { useUserStore } from '@/stores/index'

interface UploadRes {
  code: number
  message: string
  data: { id: string; url: string }
}

const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)
const form = ref({ name: '', imgurl: '' })

// 头像：选好先在本地预览，点「确认」时才上传
const avatarFile = ref<File | null>(null)
const avatarPreview = ref('')
let avatarObjectUrl = ''

const loadProfile = async () => {
  loading.value = true
  try {
    const res = await getProfile()
    form.value = { name: res.data.name, imgurl: res.data.imgurl }
    avatarPreview.value = toAbsoluteUrl(res.data.imgurl)
  } finally {
    loading.value = false
  }
}

// 选头像：只校验图片 + 大小，不上传
const handleAvatarChange = (uploadFile: { raw?: File }) => {
  const raw = uploadFile.raw
  if (!raw) return

  if (!raw.type.startsWith('image/')) {
    ElMessage.error('头像必须是图片')
    return
  }
  if (raw.size > 5 * 1024 * 1024) {
    ElMessage.error('头像不要超过 5MB')
    return
  }

  if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl)
  avatarObjectUrl = URL.createObjectURL(raw)
  avatarFile.value = raw
  avatarPreview.value = avatarObjectUrl
}
// 这个有个问题，未来优化可以将他封装成有个专门的上传接口？...？算了以后看看，还有频繁上传会不会覆盖？，还有文件累计问题？？
const uploadAvatar = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await http.post<any, UploadRes>('/files/uploadFile', formData, { timeout: 60000 })
  return res.data.url
}

// 点「确认」：先补传头像，再一次性提交名称 + 头像
const handleSubmit = async () => {
  if (!form.value.name.trim()) {
    ElMessage.warning('名称不能为空')
    return
  }

  submitting.value = true
  try {
    let imgurl = form.value.imgurl
    if (avatarFile.value) {
      imgurl = await uploadAvatar(avatarFile.value)
      avatarFile.value = null
    }

    const res = await updateProfile({ name: form.value.name.trim(), imgurl })
    ElMessage.success('保存成功')

    // 顶栏头像和名称也一起更新
    userStore.setUserData({ ...userStore.userData, name: res.data.name, imgurl: res.data.imgurl })
    form.value = { name: res.data.name, imgurl: res.data.imgurl }
    avatarPreview.value = toAbsoluteUrl(res.data.imgurl)
  } finally {
    submitting.value = false
  }
}

onMounted(loadProfile)

onBeforeUnmount(() => {
  if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl)
})
</script>

<style scoped lang="scss">
.profile-page {
  background-color: $my-bg-page;
  min-height: 100%;
}

.page-body {
  padding: 20px;
}

.profile-card {
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

.avatar-box {
  display: flex;
  align-items: flex-end;
  gap: 16px;

  .avatar-upload {
    :deep(.el-upload) {
      width: 72px;
      height: 72px;
      border-radius: 10%;
      overflow: hidden;
      border: 1px dashed $my-border-color;
      transition: border-color 0.2s;

      &:hover {
        border-color: var(--el-color-primary);
      }
    }
  }

  .avatar-img {
    width: 72px;
    height: 72px;
    object-fit: cover;
    display: block;
  }

  .avatar-empty {
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: $my-text-sub;
    background-color: $my-bg-hover;
  }

  .avatar-tip {
    font-size: 12px;
    color: $my-text-sub;
  }
}
</style>
