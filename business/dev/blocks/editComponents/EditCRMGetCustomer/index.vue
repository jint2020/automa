<template>
  <div class="edit-crm-get-customer">
    <!-- 查询条件配置 -->
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">查询条件</p>

      <ui-select
        :model-value="data.queryType"
        label="查询类型"
        placeholder="请选择查询类型"
        class="mb-2"
        @change="updateData({ queryType: $event })"
      >
        <option v-for="item in qType" :key="item.value" :value="item.value">
          {{ item.label }}
        </option>
      </ui-select>

      <ui-input
        :model-value="data.queryValue"
        label="查询值"
        placeholder="输入查询值，支持 {{ variable }}"
        @change="updateData({ queryValue: $event })"
      />
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

// 查询类型选项
const qType = [
  { label: '接入号', value: 'accessNumber' },
  { label: '客户编码', value: 'cusNumber' },
  // 可以添加更多查询类型
  // { label: '客户ID', value: 'customerId' },
];

// 更新数据到 workflow 节点
function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
