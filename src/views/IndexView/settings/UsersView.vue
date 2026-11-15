<template>
  <div class="users-page">
    <HeadTitle :title="'用户管理'">
      <el-button v-if="isAdmin" type="primary" @click="dialogVisible = true">
        <el-icon><Plus /></el-icon>
        添加用户
      </el-button>
    </HeadTitle>

    <div class="page-body">
      <el-table v-loading="loading" :data="users" class="user-table">
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column label="手机号" min-width="130">
          <template #default="{ row }">{{ row.phone || '—' }}</template>
        </el-table-column>
        <el-table-column label="权限" width="150">
          <template #default="{ row }">
            <el-select
              v-model="row.permission"
              size="small"
              :disabled="!canEdit(row)"
              @change="handlePermissionChange(row)">
              <el-option
                v-for="opt in PERMISSION_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="120">
          <template #default="{ row }">{{ row.created_at.slice(0, 10) }}</template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加用户 -->
    <el-dialog v-model="dialogVisible" title="添加用户" width="460px" destroy-on-close>
      <el-form :model="form" label-width="70px">
        <el-form-item label="名称">
          <el-input v-model="form.name" maxlength="20" placeholder="登录用的账号名" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="必填，改密码时用" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password placeholder="登录密码" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="选填，如 8613800138000" />
        </el-form-item>
        <el-form-item label="权限">
          <el-select v-model="form.permission" style="width: 100%">
            <el-option
              v-for="opt in PERMISSION_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleAdd">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import HeadTitle from '@/components/bar/HeadTitle.vue'
import { getUsers, addUser, updatePermission, type UserRow } from '@/api/users'
import { useUserStore } from '@/stores/index'

/** 权限选项：数字越小权限越大，0 最高 */
const PERMISSION_OPTIONS = [
  { value: 0, label: '0 · 最高' },
  { value: 1, label: '1 · 普通' },
  { value: 2, label: '2 · 受限' },
  { value: 3, label: '3 · 只读' },
]

const userStore = useUserStore()
const isAdmin = computed(() => userStore.userData.permission === 0)

const users = ref<UserRow[]>([])
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const form = ref({ name: '', email: '', password: '', phone: '', permission: 1 })

/** 只有 0 级能改权限，而且不能改自己 */
const canEdit = (row: UserRow) => isAdmin.value && row.id !== userStore.userData.id

const loadUsers = async () => {
  loading.value = true
  try {
    const res = await getUsers()
    users.value = res.data
  } finally {
    loading.value = false
  }
}

// 下拉框一改就提交；失败时重新拉列表把值还原
const handlePermissionChange = async (row: UserRow) => {
  try {
    await updatePermission({ id: row.id, permission: row.permission })
    ElMessage.success(`${row.name} 的权限已改为 ${row.permission}`)
  } catch {
    await loadUsers()
  }
}

const handleAdd = async () => {
  const { name, email, password, phone, permission } = form.value

  if (!name.trim() || !email.trim() || !password) {
    ElMessage.warning('名称、邮箱、密码都要填')
    return
  }

  submitting.value = true
  try {
    await addUser({
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim() || null,
      permission,
    })
    ElMessage.success('添加成功')
    dialogVisible.value = false
    form.value = { name: '', email: '', password: '', phone: '', permission: 1 }
    await loadUsers()
  } finally {
    submitting.value = false
  }
}

onMounted(loadUsers)
</script>

<style scoped lang="scss">
.users-page {
  background-color: $my-bg-page;
  min-height: 100%;
}

.page-body {
  padding: 20px;
}

.user-table {
  border-radius: 8px;
  overflow: hidden;
}
</style>
