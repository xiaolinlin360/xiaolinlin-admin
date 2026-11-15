<template>
  <div class="settings-page">
    <HeadTitle :title="'密码与绑定'" />
    <div class="page-body">
      <el-empty description="这里将放：重置密码（原密码 / 邮箱验证码 / 手机验证码）、更换手机号、更换邮箱" />
    </div>
  </div>
</template>

<script setup lang="ts">
import HeadTitle from '@/components/bar/HeadTitle.vue'
</script>

<style scoped lang="scss">
.settings-page {
  background-color: $my-bg-page;
  min-height: 100%;
}

.page-body {
  padding: 20px;
}
</style>
