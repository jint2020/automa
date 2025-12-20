<template>
  <span
    v-if="isTeam && workflow.tag"
    :class="tagColors[workflow.tag]"
    class="mr-2 rounded-md p-1 text-sm capitalize text-black"
  >
    {{ workflow.tag }}
  </span>
  <ui-card
    v-if="!isTeam"
    padding="p-1"
    class="pointer-events-auto ml-4 flex items-center"
  >
    <ui-popover>
      <template #trigger>
        <button
          v-tooltip.group="t('workflow.host.title')"
          class="hoverable rounded-lg p-2"
        >
          <v-remixicon
            :class="{ 'text-primary': hosted }"
            name="riBaseStationLine"
          />
        </button>
      </template>
      <div :class="{ 'text-center': state.isUploadingHost }" class="w-64">
        <div class="flex items-center text-gray-600 dark:text-gray-200">
          <p>
            {{ t('workflow.host.set') }}
          </p>
          <a
            :title="t('common.docs')"
            href="https://docs.extension.automa.site/workflow/sharing-workflow.html#host-workflow"
            target="_blank"
            class="ml-1"
          >
            <v-remixicon name="riInformationLine" size="20" />
          </a>
          <div class="grow"></div>
          <ui-spinner v-if="state.isUploadingHost" color="text-accent" />
          <ui-switch
            v-else
            :model-value="Boolean(hosted)"
            @change="setAsHostWorkflow"
          />
        </div>
        <transition-expand>
          <ui-input
            v-if="hosted"
            v-tooltip:bottom="t('workflow.host.id')"
            :model-value="hosted.hostId"
            prepend-icon="riLinkM"
            readonly
            class="mt-4 block w-full"
            @click="$event.target.select()"
          />
        </transition-expand>
      </div>
    </ui-popover>
    <ui-popover :disabled="userDontHaveTeamsAccess">
      <template #trigger>
        <button
          v-tooltip.group="t('workflow.share.title')"
          :class="{ 'text-primary': shared }"
          class="hoverable rounded-lg p-2"
          @click="shareWorkflow(!userDontHaveTeamsAccess)"
        >
          <v-remixicon name="riShareLine" />
        </button>
      </template>
      <p class="font-semibold">Share the workflow</p>
      <ui-list class="mt-2 w-56 space-y-1">
        <ui-list-item
          v-close-popover
          class="cursor-pointer"
          @click="shareWorkflowWithTeam"
        >
          <v-remixicon name="riTeamLine" class="-ml-1 mr-2" />
          With your team
        </ui-list-item>
        <ui-list-item
          v-close-popover
          class="cursor-pointer"
          @click="shareWorkflow()"
        >
          <v-remixicon name="riGroupLine" class="-ml-1 mr-2" />
          With the community
        </ui-list-item>
      </ui-list>
    </ui-popover>
  </ui-card>
  <ui-card
    v-if="canEdit"
    padding="p-1 ml-4 hidden md:block pointer-events-auto"
  >
    <button
      v-for="item in modalActions"
      :key="item.id"
      v-tooltip.group="item.name"
      class="hoverable rounded-lg p-2"
      @click="$emit('modal', item.id)"
    >
      <v-remixicon :name="item.icon" />
    </button>
  </ui-card>
  <ui-card padding="p-1 ml-4 flex items-center pointer-events-auto">
    <ui-popover v-if="canEdit" class="md:hidden">
      <template #trigger>
        <button class="hoverable rounded-lg p-2">
          <v-remixicon name="riMore2Line" />
        </button>
      </template>
      <ui-list class="cursor-pointer space-y-1">
        <ui-list-item
          v-for="item in modalActions"
          :key="item.id"
          v-close-popover
          @click="$emit('modal', item.id)"
        >
          <v-remixicon :name="item.icon" class="mr-2 -ml-1" />
          {{ item.name }}
        </ui-list-item>
      </ui-list>
    </ui-popover>
    <template v-if="!workflow.isDisabled">
      <button
        v-if="canEdit"
        v-tooltip.group="
          t(`workflow.testing.${isDataChanged ? 'disabled' : 'title'}`)
        "
        :class="[
          { 'cursor-default': isDataChanged },
          workflow.testingMode
            ? 'bg-primary bg-opacity-20 text-primary'
            : 'hoverable',
        ]"
        class="rounded-lg p-2"
        @click="toggleTestingMode"
      >
        <v-remixicon name="riBug2Line" />
      </button>
      <!-- <button
        v-tooltip.group="
          `${t('common.execute')} (${
            shortcuts['editor:execute-workflow'].readable
          })`
        "
        class="hoverable rounded-lg p-2"
        @click="executeCurrWorkflow"
      >
        <v-remixicon name="riPlayLine" />
      </button> -->
    </template>
    <button
      v-else
      v-tooltip="t('workflow.clickToEnable')"
      class="p-2"
      @click="updateWorkflow({ isDisabled: false })"
    >
      {{ t('common.disabled') }}
    </button>
  </ui-card>
  <ui-card padding="p-1 ml-4 space-x-1 pointer-events-auto flex items-center">
    <!-- 服务状态指示器 -->
    <button
      v-tooltip.group="serviceStatusTooltip"
      class="hoverable rounded-lg p-2"
      @click="executionStore.checkHealth()"
    >
      <v-remixicon name="riServerLine" :class="serviceStatusColor" />
    </button>
    <!-- 运行/停止按钮 -->
    <button
      v-if="!executionStore.isExecuting"
      v-tooltip.group="runButtonTooltip"
      :class="[canExecuteLocal ? 'hoverable' : 'cursor-not-allowed opacity-50']"
      class="rounded-lg p-2"
      @click="executeLocalWorkflow"
    >
      <v-remixicon name="riPlayLine" class="text-green-500" />
    </button>
    <button
      v-else
      v-tooltip.group="'停止执行'"
      class="hoverable rounded-lg p-2"
      @click="stopLocalExecution"
    >
      <v-remixicon name="riStopLine" class="text-red-500" />
    </button>
    <div class="mx-1 h-5 w-px bg-gray-300 dark:bg-gray-600"></div>
    <button
      v-if="!canEdit"
      v-tooltip.group="state.triggerText"
      class="hoverable rounded-lg p-2"
    >
      <v-remixicon name="riFlashlightLine" />
    </button>
    <ui-popover>
      <template #trigger>
        <button class="hoverable rounded-lg p-2">
          <v-remixicon name="riMore2Line" />
        </button>
      </template>
      <ui-list style="min-width: 9rem">
        <ui-list-item
          v-close-popover
          class="cursor-pointer"
          @click="copyWorkflowId"
        >
          <v-remixicon name="riFileCopyLine" class="mr-2 -ml-1" />
          Copy workflow Id
        </ui-list-item>
        <ui-list-item
          v-close-popover
          class="cursor-pointer"
          :disabled="state.isPublishing"
          @click="publishWorkflowId"
        >
          <div class="mr-2 -ml-1 flex w-5 items-center justify-center">
            <v-remixicon v-if="!state.isPublishing" name="riUploadCloudLine" />
            <ui-spinner v-else size="16" color="text-primary" />
          </div>
          {{ state.isPublishing ? '发布中...' : '发布工作流' }}
        </ui-list-item>
        <ui-list-item
          v-if="isTeam && canEdit"
          v-close-popover
          class="cursor-pointer"
          @click="syncWorkflow"
        >
          <v-remixicon name="riRefreshLine" class="mr-2 -ml-1" />
          <span>{{ t('workflow.host.sync.title') }}</span>
        </ui-list-item>
        <ui-list-item
          class="cursor-pointer"
          @click="updateWorkflow({ isDisabled: !workflow.isDisabled })"
        >
          <v-remixicon name="riToggleLine" class="mr-2 -ml-1" />
          {{ t(`common.${workflow.isDisabled ? 'enable' : 'disable'}`) }}
        </ui-list-item>
        <ui-list-item
          v-for="item in moreActions"
          :key="item.id"
          v-bind="item.attrs || {}"
          v-close-popover
          class="cursor-pointer"
          @click="item.action"
        >
          <v-remixicon :name="item.icon" class="mr-2 -ml-1" />
          {{ item.name }}
        </ui-list-item>
        <ui-list-item
          v-if="
            isTeam &&
            canEdit &&
            userStore.validateTeamAccess(teamId, ['owner', 'create'])
          "
          v-close-popover
          class="cursor-pointer text-red-400 dark:text-red-500"
          @click="deleteFromTeam"
        >
          <v-remixicon name="riDeleteBin7Line" class="mr-2 -ml-1" />
          <span>Delete from team</span>
        </ui-list-item>
      </ui-list>
    </ui-popover>
    <ui-button
      v-if="!isTeam"
      :title="shortcuts['editor:save'].readable"
      variant="accent"
      class="relative px-2 md:px-4"
      @click="saveWorkflow"
    >
      <span
        v-if="isDataChanged"
        class="absolute top-0 left-0 -ml-1 -mt-1 flex h-3 w-3"
      >
        <span
          class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"
        ></span>
        <span
          class="relative inline-flex h-3 w-3 rounded-full bg-blue-600"
        ></span>
      </span>
      <v-remixicon name="riSaveLine" class="my-1 md:-ml-1" />
      <span class="ml-2 hidden md:block">{{ t('common.save') }}</span>
    </ui-button>
    <ui-button
      v-else-if="!canEdit"
      v-tooltip.group="'Sync workflow'"
      :loading="state.loadingSync"
      variant="accent"
      @click="syncWorkflow"
    >
      <v-remixicon name="riRefreshLine" class="mr-2 -ml-1" />
      <span>
        {{ t('workflow.host.sync.title') }}
      </span>
    </ui-button>
    <template v-else>
      <ui-button
        v-tooltip="`Save workflow (${shortcuts['editor:save'].readable})`"
        class="mr-2"
        icon
        @click="saveWorkflow"
      >
        <span
          v-if="isDataChanged"
          class="absolute top-0 left-0 -ml-1 -mt-1 flex h-3 w-3"
        >
          <span
            class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"
          ></span>
          <span
            class="relative inline-flex h-3 w-3 rounded-full bg-blue-600"
          ></span>
        </span>
        <v-remixicon name="riSaveLine" />
      </ui-button>
      <ui-button
        v-tooltip="'Publish workflow update'"
        :loading="state.isPublishing"
        variant="accent"
        @click="publishWorkflow"
      >
        Publish
      </ui-button>
    </template>
  </ui-card>
  <ui-modal v-model="state.showEditDescription" persist blur custom-content>
    <workflow-share-team
      :workflow="workflow"
      :is-update="true"
      @update="updateWorkflowDescription"
      @close="state.showEditDescription = false"
    />
  </ui-modal>
  <ui-modal v-model="renameState.showModal" title="Rename">
    <ui-input
      v-model="renameState.name"
      :placeholder="t('common.name')"
      autofocus
      class="mb-4 w-full"
      @keyup.enter="renameWorkflow"
    />
    <ui-textarea
      v-model="renameState.description"
      :placeholder="t('common.description')"
      height="165px"
      class="w-full dark:text-gray-200"
      max="300"
      style="min-height: 140px"
    />
    <p class="mb-6 text-right text-gray-600 dark:text-gray-200">
      {{ renameState.description.length }}/300
    </p>
    <div class="flex space-x-2">
      <ui-button class="w-full" @click="clearRenameModal">
        {{ t('common.cancel') }}
      </ui-button>
      <ui-button variant="accent" class="w-full" @click="renameWorkflow">
        {{ t('common.update') }}
      </ui-button>
    </div>
  </ui-modal>
</template>
<script setup>
import WorkflowShareTeam from '@/components/newtab/workflow/WorkflowShareTeam.vue';
import { useDialog } from '@/composable/dialog';
import { useGroupTooltip } from '@/composable/groupTooltip';
import { getShortcut, useShortcut } from '@/composable/shortcut';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';
import { useStore } from '@/stores/main';
import { usePackageStore } from '@/stores/package';
import { useSharedWorkflowStore } from '@/stores/sharedWorkflow';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';
import { useUserStore } from '@/stores/user';
import { useWorkflowStore } from '@/stores/workflow';
import { useExecutionStore, ServiceStatus } from '@/stores/execution';
import { publishWorkflow as publishWorkflowApi } from '@/apis';
import { fetchApi } from '@/utils/api';
import convertWorkflowData from '@/utils/convertWorkflowData';
import { findTriggerBlock, parseJSON } from '@/utils/helper';
import { tagColors } from '@/utils/shared';
import getTriggerText from '@/utils/triggerText';
import { convertWorkflow, exportWorkflow } from '@/utils/workflowData';
import { registerWorkflowTrigger } from '@/utils/workflowTrigger';
import { computed, reactive, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import browser from 'webextension-polyfill';

const props = defineProps({
  isDataChanged: {
    type: Boolean,
    default: false,
  },
  workflow: {
    type: Object,
    default: () => ({}),
  },
  editor: {
    type: Object,
    default: () => ({}),
  },
  changedData: {
    type: Object,
    default: () => ({}),
  },
  canEdit: {
    type: Boolean,
    default: true,
  },
  isTeam: Boolean,
  isPackage: Boolean,
});
const emit = defineEmits(['modal', 'change', 'update', 'permission']);

useGroupTooltip();

const { t } = useI18n();
const toast = useToast();
const router = useRouter();
const dialog = useDialog();
const mainStore = useStore();
const userStore = useUserStore();
const packageStore = usePackageStore();
const workflowStore = useWorkflowStore();
const teamWorkflowStore = useTeamWorkflowStore();
const sharedWorkflowStore = useSharedWorkflowStore();
const shortcuts = useShortcut(
  /* eslint-disable-next-line */
  getShortcut('editor:save', saveWorkflow),
  /* eslint-disable-next-line */
  getShortcut('editor:execute-workflow', executeCurrWorkflow)
);

const { teamId } = router.currentRoute.value.params;

// 初始化执行 store
const executionStore = useExecutionStore();

const state = reactive({
  triggerText: '',
  loadingSync: false,
  isPublishing: false,
  isUploadingHost: false,
  showEditDescription: false,
});

// 本地服务状态计算属性
const canExecuteLocal = computed(() => {
  // 必须先保存工作流才能执行
  if (props.isDataChanged) return false;
  // 服务必须健康
  if (!executionStore.isServiceHealthy) return false;
  // 不能正在执行中
  if (executionStore.isExecuting) return false;
  return true;
});

// 运行按钮提示文本
const runButtonTooltip = computed(() => {
  if (!props.workflow.published) {
    return '工作流未发布，无法本地调试运行';
  }
  if (props.workflow.isDisabled) {
    return '工作流已禁用，无法本地调试运行';
  }
  if (props.isDataChanged) {
    return '请先保存工作流';
  }
  if (!executionStore.isServiceHealthy) {
    return '本地服务未启动，请启动调试服务';
  }
  if (executionStore.isExecuting) {
    return '工作流执行中...';
  }
  return '运行工作流 (本地调试)';
});

// 服务状态提示文本
const serviceStatusTooltip = computed(() => {
  if (executionStore.localServiceStatus === ServiceStatus.UNKNOWN) {
    return '正在检查本地服务状态...';
  }
  if (executionStore.isServiceHealthy) {
    return '本地服务已连接';
  }
  return executionStore.healthCheckError || '本地服务未连接';
});

// 服务状态图标颜色
const serviceStatusColor = computed(() => {
  if (executionStore.localServiceStatus === ServiceStatus.UNKNOWN) {
    return 'text-gray-400';
  }
  return executionStore.isServiceHealthy ? 'text-green-500' : 'text-red-500';
});
const renameState = reactive({
  name: '',
  description: '',
  showModal: false,
});

// 启动健康检查
onMounted(() => {
  executionStore.startHealthCheck(5000);
});

// 停止健康检查
onUnmounted(() => {
  executionStore.stopHealthCheck();
});

const shared = computed(() => sharedWorkflowStore.getById(props.workflow.id));
const hosted = computed(() => userStore.hostedWorkflows[props.workflow.id]);
const userDontHaveTeamsAccess = computed(() => {
  if (props.isTeam || !userStore.user?.teams) return true;

  return !userStore.user.teams.some((team) =>
    team.access.some((item) => ['owner', 'create'].includes(item))
  );
});

function updateWorkflow(data = {}, changedIndicator = false) {
  let store = null;

  if (props.isTeam) {
    store = teamWorkflowStore.update({
      data,
      teamId,
      id: props.workflow.id,
    });
  } else {
    store = workflowStore.update({
      data,
      id: props.workflow.id,
    });
  }

  return store.then((result) => {
    emit('update', { data, changedIndicator });

    return result;
  });
}
function toggleTestingMode() {
  if (props.isDataChanged) return;

  updateWorkflow({ testingMode: !props.workflow.testingMode });
}
function copyWorkflowId() {
  navigator.clipboard.writeText(props.workflow.id).catch((error) => {
    console.error(error);

    const textarea = document.createElement('textarea');
    textarea.value = props.workflow.id;
    textarea.select();
    document.execCommand('copy');
    textarea.blur();
  });
}

async function publishWorkflowId() {
  // 检查是否已保存工作流
  if (props.isDataChanged) {
    toast.warning('请先保存工作流后再发布');
    return;
  }

  // 检查是否有 trigger 块
  const triggerBlock = props.workflow.drawflow?.nodes?.find(
    (node) => node.label === 'trigger'
  );
  if (!triggerBlock) {
    toast.error('工作流必须包含触发器(trigger)块');
    return;
  }

  const workFlowId = props.workflow.id;

  try {
    state.isPublishing = true;

    // 准备发布数据
    const publishData = {
      id: props.workflow.id,
      name: props.workflow.name,
      description: props.workflow.description,
      drawflow: props.workflow.drawflow,
      trigger: props.workflow.trigger || triggerBlock.data,
      globalData: props.workflow.globalData,
      table: props.workflow.table || [],
      dataColumns: props.workflow.dataColumns || [],
      settings: props.workflow.settings,
    };

    // 调用发布 API
    const response = await publishWorkflowApi(workFlowId, publishData);

    // axios 响应数据在 response.data 中
    if (!response.data.success) {
      throw new Error(response.data.message || '发布失败');
    }

    const result = response.data;

    toast.success('工作流发布成功！');

    // 更新工作流状态为已发布
    await updateWorkflow({
      published: true,
      publishUrl: result.publishUrl,
      publishedAt: new Date().toISOString(),
    });

    // 如果有发布后的 URL，复制到剪贴板
    if (result.publishUrl) {
      navigator.clipboard.writeText(result.publishUrl);
      toast.info('发布地址已复制到剪贴板');
    }
  } catch (error) {
    console.error('发布工作流失败:', error);
    toast.error(error.message || '发布失败，请重试');
  } finally {
    state.isPublishing = false;
  }
}

function updateWorkflowDescription(value) {
  const keys = ['description', 'category', 'content', 'tag', 'name'];
  const payload = {};

  keys.forEach((key) => {
    payload[key] = value[key];
  });

  updateWorkflow(payload);
  state.showEditDescription = false;
}
async function saveWorkflow() {
  try {
    const flow = props.editor.toObject();
    flow.edges = flow.edges.map((edge) => {
      delete edge.sourceNode;
      delete edge.targetNode;

      return edge;
    });

    const triggerBlock = flow.nodes.find((node) => node.label === 'trigger');
    if (!triggerBlock) {
      toast.error(t('message.noTriggerBlock'));
      return;
    }

    await updateWorkflow(
      {
        drawflow: flow,
        trigger: triggerBlock.data,
        version: browser.runtime.getManifest().version,
      },
      false
    );
    await registerWorkflowTrigger(props.workflow.id, triggerBlock);

    emit('change', { drawflow: flow });
  } catch (error) {
    console.error(error);
  }
}
async function executeCurrWorkflow() {
  if (mainStore.settings.editor.saveWhenExecute && props.isDataChanged) {
    saveWorkflow();
  }

  RendererWorkflowService.executeWorkflow({
    ...props.workflow,
    isTesting: props.isDataChanged,
  });
}

/**
 * 本地调试执行工作流
 */
async function executeLocalWorkflow() {
  // 检查服务状态
  if (!executionStore.isServiceHealthy) {
    toast.error('本地服务未启动，请先启动调试服务');
    return;
  }
  // 检查是否已保存
  if (props.isDataChanged) {
    toast.warning('请先保存工作流后再执行');
    return;
  }

  if (props.workflow.isDisabled) {
    toast.warning('工作流已禁用，无法本地执行');
    return;
  }

  if (!props.workflow.published) {
    toast.warning('工作流未发布，无法本地调试运行');
    return;
  }

  // 检查是否正在执行
  if (executionStore.isExecuting) {
    toast.warning('已有工作流正在执行中');
    return;
  }

  try {
    await executionStore.executeWorkflow(props.workflow);
    toast.success('工作流开始执行');
    // 触发显示执行日志面板
    emit('modal', 'execution-logs');
  } catch (error) {
    toast.error(error.message || '执行失败');
    console.error('执行工作流失败:', error);
  }
}

/**
 * 停止本地执行
 */
async function stopLocalExecution() {
  try {
    await executionStore.stopExecution();
    toast.info('工作流已停止');
  } catch (error) {
    toast.error(error.message || '停止执行失败');
    console.error('停止执行失败:', error);
  }
}
async function setAsHostWorkflow(isHost) {
  if (!userStore.user) {
    dialog.custom('auth', {
      title: t('auth.title'),
    });
    return;
  }

  state.isUploadingHost = true;

  try {
    let url = '/me/workflows';
    let payload = {
      auth: true,
    };

    if (isHost) {
      const workflowPaylod = convertWorkflow(props.workflow, ['id']);
      workflowPaylod.drawflow = parseJSON(
        props.workflow.drawflow,
        props.workflow.drawflow
      );
      delete workflowPaylod.extVersion;

      url += `/host`;
      payload = {
        auth: true,
        method: 'POST',
        body: JSON.stringify({
          workflow: workflowPaylod,
        }),
      };
    } else {
      url += `?id=${props.workflow.id}&type=host`;
      payload.method = 'DELETE';
    }

    const response = await fetchApi(url, payload);
    const result = await response.json();

    if (!response.ok) {
      const error = new Error(result.message);
      error.data = result.data;

      throw error;
    }

    if (isHost) {
      userStore.hostedWorkflows[props.workflow.id] = result;
    } else {
      delete userStore.hostedWorkflows[props.workflow.id];
    }

    // Update cache
    const userWorkflows = parseJSON('user-workflows', {
      backup: [],
      hosted: {},
    });
    userWorkflows.hosted = userStore.hostedWorkflows;
    sessionStorage.setItem('user-workflows', JSON.stringify(userWorkflows));

    state.isUploadingHost = false;
  } catch (error) {
    console.error(error);
    state.isUploadingHost = false;
    toast.error(error.message);
  }
}
function shareWorkflowWithTeam() {
  emit('modal', 'workflow-share-team');
}
function shareWorkflow(disabled = false) {
  if (disabled) return;
  if (shared.value) {
    router.push(`/workflows/${props.workflow.id}/shared`);
    return;
  }

  if (userStore.user) {
    emit('modal', 'workflow-share');
  } else {
    dialog.custom('auth', {
      title: t('auth.title'),
    });
  }
}
function deleteFromTeam() {
  dialog.confirm({
    async: true,
    title: 'Delete workflow from team',
    okVariant: 'danger',
    body: `Are you sure want to delete the "${props.workflow.name}" workflow from this team?`,
    onConfirm: async () => {
      try {
        const response = await fetchApi(
          `/teams/${teamId}/workflows/${props.workflow.id}`,
          { method: 'DELETE', auth: true }
        );
        const result = await response.json();

        if (!response.ok && response.status !== 404)
          throw new Error(result.message);

        await teamWorkflowStore.delete(teamId, props.workflow.id);
        router.replace(`/workflows?active=team&teamId=${teamId}`);

        return true;
      } catch (error) {
        toast.error('Something went wrong');
        console.error(error);
        return false;
      }
    },
  });
}
function clearRenameModal() {
  Object.assign(renameState, {
    id: '',
    name: '',
    description: '',
    showModal: false,
  });
}
async function publishWorkflow() {
  if (!props.canEdit) return;

  const workflowPaylod = convertWorkflow(props.workflow, [
    'id',
    'tag',
    'content',
  ]);
  workflowPaylod.drawflow = parseJSON(
    props.workflow.drawflow,
    props.workflow.drawflow
  );
  delete workflowPaylod.id;
  delete workflowPaylod.extVersion;

  state.isPublishing = true;

  try {
    const response = await fetchApi(
      `/teams/${teamId}/workflows/${props.workflow.id}`,
      {
        auth: true,
        method: 'PATCH',
        body: JSON.stringify({ workflow: workflowPaylod }),
      }
    );
    const result = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        await teamWorkflowStore.delete(teamId, props.workflow.id);
        router.replace('/');
        return;
      }

      throw new Error(result.message);
    }
  } catch (error) {
    console.error(error);
    toast.error('Something went wrong');
  } finally {
    state.isPublishing = false;
  }
}
function initRenameWorkflow() {
  if (props.isTeam) {
    state.showEditDescription = true;
    return;
  }

  Object.assign(renameState, {
    showModal: true,
    name: `${props.workflow.name}`,
    description: `${props.workflow.description}`,
  });
}
function renameWorkflow() {
  updateWorkflow({
    name: renameState.name,
    description: renameState.description,
  });
  clearRenameModal();
}
function deleteWorkflow() {
  dialog.confirm({
    title: props.isPackage ? t('common.delete') : t('workflow.delete'),
    okVariant: 'danger',
    body: props.isPackage
      ? `Are you sure want to delete "${props.workflow.name}" package?`
      : t('message.delete', { name: props.workflow.name }),
    onConfirm: async () => {
      if (props.isPackage) {
        await packageStore.delete(props.workflow.id);
      } else if (props.isTeam) {
        await teamWorkflowStore.delete(teamId, props.workflow.id);
      } else {
        await workflowStore.delete(props.workflow.id);
      }

      router.replace(props.isPackage ? '/packages' : '/');
    },
  });
}

async function retrieveTriggerText() {
  if (props.canEdit) return;

  const triggerBlock = findTriggerBlock(props.workflow.drawflow);
  if (!triggerBlock) return;

  state.triggerText = await getTriggerText(
    triggerBlock.data,
    t,
    router.currentRoute.value.params.id,
    true
  );
}
async function fetchSyncWorkflow() {
  try {
    const response = await fetchApi(
      `/teams/${teamId}/workflows/${props.workflow.id}`,
      { auth: true }
    );
    const result = await response.json();

    if (response.status === 404) {
      await teamWorkflowStore.delete(teamId, props.workflow.id);
      router.replace(`/workflows?active=team&teamId=${teamId}`);
      return;
    }
    if (!response.ok) throw new Error(result.message);

    await teamWorkflowStore.update({
      teamId,
      data: result,
      id: props.workflow.id,
    });

    const convertedData = convertWorkflowData(result);
    props.editor.setNodes(convertedData.drawflow.nodes || []);
    props.editor.setEdges(convertedData.drawflow.edges || []);
    props.editor.fitView();

    await retrieveTriggerText();

    const triggerBlock = convertedData.drawflow.nodes.find(
      (node) => node.label === 'trigger'
    );
    registerWorkflowTrigger(props.workflow.id, triggerBlock);
    emit('permission');
  } catch (error) {
    toast.error(error.message);
    console.error(error);
  } finally {
    state.loadingSync = false;
    toast.dismiss('sync');
  }
}
async function syncWorkflow() {
  state.loadingSync = true;

  if (props.canEdit) {
    dialog.confirm({
      title: 'Sync workflow',
      okText: 'Sync',
      body: 'This action will overwrite the current workflow with the one that stored in cloud',
      onConfirm: () => {
        fetchSyncWorkflow();
        toast('Syncing workflow...', { timeout: false, id: 'sync' });
      },
    });
  } else {
    fetchSyncWorkflow();
  }
}

retrieveTriggerText();

const modalActions = [
  {
    id: 'table',
    name: t('workflow.table.title'),
    icon: 'riTable2',
  },
  {
    id: 'global-data',
    name: t('common.globalData'),
    icon: 'riDatabase2Line',
  },
  {
    id: 'variables',
    name: t('common.variables'),
    icon: 'riBracketsLine',
  },
  {
    id: 'settings',
    name: t('common.settings'),
    icon: 'riSettings3Line',
  },
];
const moreActions = [
  {
    id: 'export',
    icon: 'riDownloadLine',
    name: t('common.export'),
    action: () => exportWorkflow(props.workflow),
    hasAccess: props.isTeam ? props.canEdit : true,
  },
  {
    id: 'rename',
    icon: 'riPencilLine',
    hasAccess: props.isTeam ? props.canEdit : true,
    name: props.isTeam ? 'Edit detail' : t('common.rename'),
    action: initRenameWorkflow,
  },
  {
    id: 'delete',
    hasAccess: true,
    action: deleteWorkflow,
    name: t('common.delete'),
    icon: 'riDeleteBin7Line',
    attrs: {
      class: 'text-red-400 dark:text-red-500',
    },
  },
].filter((item) => item.hasAccess);
</script>
