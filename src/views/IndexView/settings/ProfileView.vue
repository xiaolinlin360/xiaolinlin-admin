<template>
  <div class="settings-page">
    <HeadTitle :title="'个人主页'" />
    <div class="page-body">
      <el-empty description="这里将放：用户名、头像、个人简介" />
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
