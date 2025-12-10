<template>
  <div class="edit-login">
    <!-- 登录参数配置 -->
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">登录参数</p>

      <!-- 登录方式选择 -->
      <ui-select
        :model-value="data.loginMethod"
        label="登录方式"
        class="mb-2"
        @change="updateData({ loginMethod: $event })"
      >
        <option value="account">账号密码</option>
        <option value="cookie">Cookie (JSESSIONID)</option>
      </ui-select>

      <!-- 账号密码登录 -->
      <template v-if="data.loginMethod === 'account'">
        <ui-input
          :model-value="data.username"
          label="用户名"
          placeholder="输入用户名，支持 {{ variable }}"
          class="mb-2"
          @change="updateData({ username: $event })"
        />

        <ui-input
          :model-value="data.password"
          label="密码"
          placeholder="输入密码，支持 {{ variable }}"
          type="password"
          class="mb-2"
          @change="updateData({ password: $event })"
        />
      </template>

      <!-- 岗位名称 -->
      <ui-input
        :model-value="data.position"
        label="岗位名称"
        placeholder="输入岗位名称，支持 {{ variable }}"
        class="mb-2"
        @change="updateData({ position: $event })"
      />
    </ui-card>

    <!-- 模拟响应配置 -->
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">模拟响应</p>

      <ui-checkbox
        :model-value="data.mockResponse"
        class="mb-2"
        @change="updateData({ mockResponse: $event })"
      >
        启用模拟响应（测试用）
      </ui-checkbox>

      <template v-if="data.mockResponse">
        <ui-input
          :model-value="data.mockToken"
          label="模拟 Token"
          placeholder="mock_token_123456"
          class="mb-2"
          @change="updateData({ mockToken: $event })"
        />

        <ui-textarea
          :model-value="data.mockUserInfo"
          label="模拟用户信息 (JSON)"
          placeholder='{"userId": "001", "userName": "测试用户"}'
          @change="updateData({ mockUserInfo: $event })"
        />
      </template>
    </ui-card>

    <hr />

    <!-- 使用标准的变量赋值组件 -->
    <insert-workflow-data :data="data" variables @update="updateData" />
  </div>
</template>

<script setup>
import InsertWorkflowData from '@/components/newtab/workflow/edit/InsertWorkflowData.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:data']);

// 更新数据到 workflow 节点
function updateData(value) {
  // 如果选择了 Cookie 登录，清空账号密码字段
  if (value.loginMethod === 'cookie') {
    value.username = '';
    value.password = '';
  }

  emit('update:data', { ...props.data, ...value });
}
</script>
