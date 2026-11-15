<template>
  <div class="settings-page">
    <HeadTitle :title="'用户管理'" />
    <div class="page-body">
      <el-empty description="这里将放：用户列表、添加新用户、权限（0 最高）设置" />
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
