<template>
  <div class="guestbook-card">
    <div class="card-header">
      <span class="title">留言 {{ total }}</span>
    </div>

    <!-- 留言列表：内部独立滚动 -->
    <div class="guestbook-list">
      <div v-for="item in list" :key="item.id" class="guestbook-item">
        <div class="avatar">{{ item.nickname.slice(0, 1) }}</div>

        <div class="body">
          <div class="header-row">
            <span class="nickname">{{ item.nickname }}</span>
            <span class="time">{{ formatTime(item.created_at) }}</span>

            <div class="ops">
              <!-- 回复和删除都只有博主本人（权限 0）能用，后端这两个接口同样限制 -->
              <el-button v-if="isOwner" link type="primary" @click="openReply(item)">
                {{ item.reply ? '改回复' : '回复' }}
              </el-button>
              <el-icon v-if="isOwner" class="delete-icon" @click="handleDelete(item.id)">
                <Delete />
              </el-icon>
            </div>
          </div>

          <p class="content">{{ item.content }}</p>

          <!-- 已经回复过：把回复显示出来 -->
          <div v-if="item.reply" class="reply">
            <span class="reply-label">博主回复 · {{ formatTime(item.replied_at ?? '') }}</span>
            <p class="reply-text">{{ item.reply }}</p>
          </div>

          <!-- 只有点了「回复」的那条才出现输入框 -->
          <div v-if="editingId === item.id" class="reply-editor">
            <el-input
              v-model="replyText"
              type="textarea"
              :rows="2"
              maxlength="500"
              placeholder="写点回复..."
              class="reply-input" />
            <div class="editor-ops">
              <span v-if="item.reply" class="tip">清空保存 = 撤掉回复</span>
              <el-button size="small" @click="editingId = ''">取消</el-button>
              <el-button size="small" type="primary" :loading="submitting" @click="handleReply(item.id)">
                保存
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-if="list.length === 0" description="还没有留言" :image-size="60" />
    </div>

    <!-- 分页器固定在底部 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :page-sizes="[5, 10, 20]"
        layout="prev, pager, next"
        :total="total"
        small
        @current-change="fetchList"
        @size-change="handleSizeChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import {
  getGuestbook,
  getTotalGuestbook,
  deleteGuestbook,
  replyGuestbook,
  type Guestbook,
} from '@/api/guestbook'
import { useUserStore } from '@/stores/index'
import formatTime from '@/utils/formatTime'

const userStore = useUserStore()
// 权限 0 才是博主本人；读者（1）和管理员（2）只让看和删，不给回复
const isOwner = computed(() => userStore.userData.permission === 0)

const list = ref<Guestbook[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(5)
const submitting = ref(false)

// 正在回复哪一条（存 id，空字符串表示没在回复）
const editingId = ref('')
const replyText = ref('')

const fetchList = async () => {
  const [listRes, totalRes] = await Promise.all([
    getGuestbook({ pageNum: pageNum.value, pageSize: pageSize.value }),
    getTotalGuestbook(),
  ])
  list.value = listRes.data.guestbooks
  total.value = totalRes.data.total
}

const handleSizeChange = () => {
  pageNum.value = 1
  fetchList()
}

// 点「回复」：打开输入框，已经回过就把旧内容带出来方便改
const openReply = (item: Guestbook) => {
  editingId.value = item.id
  replyText.value = item.reply ?? ''
}

// 保存回复：只更新这一条，不整页刷新，省得列表滚动位置乱跳
const handleReply = async (id: string) => {
  submitting.value = true
  try {
    const { data } = await replyGuestbook(id, replyText.value.trim())
    const target = list.value.find((item) => item.id === id)
    if (target) Object.assign(target, data)
    ElMessage.success(data.reply ? '回复成功' : '回复已撤掉')
    editingId.value = ''
  } finally {
    submitting.value = false
  }
}

// 删除留言
const handleDelete = async (id: string) => {
  const confirm = await ElMessageBox.confirm('确定删除这条留言吗？', '提示', {
    type: 'warning',
  }).catch(() => false)
  if (!confirm) return

  await deleteGuestbook(id)
  ElMessage.success('已删除')
  await fetchList()
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.guestbook-card {
  background-color: $my-bg-card;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px $my-shadow-color;
  display: flex;
  flex-direction: column;
  height: 100%; /* 高度 100% 与左侧图表对齐 */
  overflow: hidden;
  transition:
    background-color 0.3s,
    box-shadow 0.3s;

  .card-header {
    margin-bottom: 12px;
    flex-shrink: 0;

    .title {
      font-size: 16px;
      font-weight: 600;
      color: $my-text-main;
    }
  }

  /* 留言列表 */
  .guestbook-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-right: 4px;
    margin-bottom: 12px;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background-color: #ccc;
      border-radius: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }

    .guestbook-item {
      display: flex;
      gap: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid $my-border-color;

      &:last-child {
        border-bottom: none;
      }

      /* 用称呼首字做头像，免去上传头像 */
      .avatar {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        font-weight: 600;
        color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
      }

      .body {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;

        .header-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: $my-text-sub;

          .nickname {
            font-weight: 600;
            color: $my-text-main;
          }

          .ops {
            margin-left: auto;
            display: flex;
            align-items: center;
            gap: 4px;

            .delete-icon {
              cursor: pointer;

              &:hover {
                color: #f56c6c;
              }
            }
          }
        }

        .content {
          font-size: 13px;
          color: $my-text-main;
          margin: 0;
          line-height: 1.5;
          word-break: break-word;
        }

        /* 博主回复 */
        .reply {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px 10px;
          border-radius: 6px;
          background-color: var(--el-color-primary-light-9);

          .reply-label {
            font-size: 12px;
            color: var(--el-color-primary);
          }

          .reply-text {
            margin: 0;
            font-size: 13px;
            line-height: 1.5;
            color: $my-text-main;
            word-break: break-word;
            white-space: pre-wrap;
          }
        }

        /* 回复输入框 */
        .reply-editor {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .reply-input :deep(.el-textarea__inner) {
            resize: none;
          }

          .editor-ops {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 8px;

            .tip {
              margin-right: auto;
              font-size: 12px;
              color: $my-text-sub;
            }
          }
        }
      }
    }
  }

  .pagination-wrapper {
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;

    :deep(.el-pagination.is-background .el-pager li.is-active) {
      background-color: #2b5cff;
    }
  }
}
</style>
