<template>
  <div class="flex h-full flex-col">
    <!-- 头部 -->
    <div
      class="flex items-center justify-between border-b p-3 dark:border-gray-700"
    >
      <div class="flex items-center space-x-2">
        <v-remixicon name="riTerminalBoxLine" />
        <span class="font-semibold">执行日志</span>
        <span
          v-if="executionStore.currentExecution"
          :class="statusBadgeClass"
          class="rounded-full px-2 py-0.5 text-xs"
        >
          {{ statusText }}
        </span>
      </div>
      <div class="flex items-center space-x-2">
        <button
          v-tooltip="'清空日志'"
          class="hoverable rounded-lg p-1.5"
          @click="executionStore.clearLogs()"
        >
          <v-remixicon name="riDeleteBinLine" size="18" />
        </button>
        <button
          v-tooltip="'关闭'"
          class="hoverable rounded-lg p-1.5"
          @click="$emit('close')"
        >
          <v-remixicon name="riCloseLine" size="18" />
        </button>
      </div>
    </div>

    <!-- 执行信息 -->
    <div
      v-if="executionStore.currentExecution"
      class="border-b bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="flex items-center justify-between text-sm">
        <div class="space-y-1">
          <p class="text-gray-600 dark:text-gray-300">
            <span class="font-medium">工作流:</span>
            {{ executionStore.currentExecution.workflowName }}
          </p>
          <p class="text-gray-500 dark:text-gray-400">
            <span class="font-medium">执行ID:</span>
            {{ executionStore.currentExecution.executionId }}
          </p>
        </div>
        <div v-if="executionStore.currentExecution.progress" class="text-right">
          <p class="text-gray-600 dark:text-gray-300">
            进度: {{ executionStore.currentExecution.progress }}%
          </p>
          <div class="mt-1 h-2 w-24 overflow-hidden rounded-full bg-gray-200">
            <div
              class="h-full bg-primary transition-all"
              :style="{ width: `${executionStore.currentExecution.progress}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 日志列表 -->
    <div ref="logsContainer" class="flex-1 overflow-y-auto p-3">
      <div v-if="executionStore.logs.length === 0" class="py-8 text-center">
        <v-remixicon
          name="riFileListLine"
          size="48"
          class="mx-auto mb-2 text-gray-300"
        />
        <p class="text-gray-400">暂无执行日志</p>
      </div>
      <div v-else class="space-y-1 font-mono text-sm">
        <div
          v-for="log in executionStore.logs"
          :key="log.id"
          :class="logLevelClass(log.level)"
          class="flex items-start rounded px-2 py-1"
        >
          <span class="mr-2 shrink-0 text-gray-400">
            {{ formatTime(log.timestamp) }}
          </span>
          <span
            :class="logLevelBadgeClass(log.level)"
            class="mr-2 shrink-0 rounded px-1.5 py-0.5 text-xs uppercase"
          >
            {{ log.level }}
          </span>
          <span class="break-all">{{ log.message }}</span>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div
      class="flex items-center justify-between border-t p-3 dark:border-gray-700"
    >
      <div class="flex items-center space-x-2 text-sm text-gray-500">
        <v-remixicon
          name="riServerLine"
          :class="serviceStatusColor"
          size="16"
        />
        <span>{{ serviceStatusText }}</span>
      </div>
      <div class="flex items-center space-x-2">
        <ui-button
          v-if="executionStore.isExecuting"
          variant="danger"
          class="px-4"
          @click="stopExecution"
        >
          <v-remixicon name="riStopLine" class="mr-1" size="18" />
          停止执行
        </ui-button>
        <ui-button
          v-else-if="canRetry"
          variant="accent"
          class="px-4"
          @click="$emit('retry')"
        >
          <v-remixicon name="riRefreshLine" class="mr-1" size="18" />
          重新执行
        </ui-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import {
  useExecutionStore,
  ExecutionStatus,
  ServiceStatus,
} from '@/stores/execution';
import { useToast } from 'vue-toastification';

defineEmits(['close', 'retry']);

const toast = useToast();
const executionStore = useExecutionStore();
const logsContainer = ref(null);

// 自动滚动到底部
watch(
  () => executionStore.logs.length,
  async () => {
    await nextTick();
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
    }
  }
);

// 状态文本
const statusText = computed(() => {
  switch (executionStore.executionStatus) {
    case ExecutionStatus.PENDING:
      return '准备中';
    case ExecutionStatus.RUNNING:
      return '执行中';
    case ExecutionStatus.COMPLETED:
      return '已完成';
    case ExecutionStatus.FAILED:
      return '执行失败';
    case ExecutionStatus.STOPPED:
      return '已停止';
    default:
      return '空闲';
  }
});

// 状态徽章样式
const statusBadgeClass = computed(() => {
  switch (executionStore.executionStatus) {
    case ExecutionStatus.RUNNING:
    case ExecutionStatus.PENDING:
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300';
    case ExecutionStatus.COMPLETED:
      return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300';
    case ExecutionStatus.FAILED:
      return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300';
    case ExecutionStatus.STOPPED:
      return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  }
});

// 服务状态颜色
const serviceStatusColor = computed(() => {
  if (executionStore.localServiceStatus === ServiceStatus.UNKNOWN) {
    return 'text-gray-400';
  }
  return executionStore.isServiceHealthy ? 'text-green-500' : 'text-red-500';
});

// 服务状态文本
const serviceStatusText = computed(() => {
  if (executionStore.localServiceStatus === ServiceStatus.UNKNOWN) {
    return '检查中...';
  }
  return executionStore.isServiceHealthy ? '本地服务已连接' : '本地服务未连接';
});

// 是否可以重试
const canRetry = computed(() => {
  return (
    executionStore.executionStatus === ExecutionStatus.COMPLETED ||
    executionStore.executionStatus === ExecutionStatus.FAILED ||
    executionStore.executionStatus === ExecutionStatus.STOPPED
  );
});

// 日志级别背景样式
function logLevelClass(level) {
  switch (level) {
    case 'error':
      return 'bg-red-50 dark:bg-red-900/20';
    case 'warn':
      return 'bg-yellow-50 dark:bg-yellow-900/20';
    default:
      return 'hover:bg-gray-50 dark:hover:bg-gray-800';
  }
}

// 日志级别徽章样式
function logLevelBadgeClass(level) {
  switch (level) {
    case 'error':
      return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300';
    case 'warn':
      return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300';
    case 'debug':
      return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300';
    default:
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300';
  }
}

// 格式化时间
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// 停止执行
async function stopExecution() {
  try {
    await executionStore.stopExecution();
    toast.info('执行已停止');
  } catch (error) {
    toast.error(error.message || '停止执行失败');
  }
}
</script>
