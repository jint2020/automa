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

      <ui-select
        :model-value="data.queryParams"
        label="查询值关联参数"
        placeholder="请选择查询值关联参数"
        @change="updateData({ queryParams: $event })"
      >
        <option
          v-for="item in valueFlect"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </option>
      </ui-select>
    </ui-card>

    <!-- 数据保存配置 -->
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">数据保存</p>

      <ui-input
        :model-value="data.dataColumn"
        label="保存到表格列"
        placeholder="例如: customerInfo"
        class="mb-2"
        @change="updateData({ dataColumn: $event })"
      />

      <ui-checkbox
        :model-value="data.assignVariable"
        class="mb-2"
        @change="updateData({ assignVariable: $event })"
      >
        保存到变量
      </ui-checkbox>

      <ui-input
        v-if="data.assignVariable"
        :model-value="data.variableName"
        label="变量名"
        placeholder="例如: customerData"
        @change="updateData({ variableName: $event })"
      />
    </ui-card>
  </div>
</template>

<script setup>
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
  // 可以添加更多查询类型
  // { label: '客户ID', value: 'customerId' },
  { label: '客户编码', value: 'cusNumber' },
];

// 查询值关联参数选项
const valueFlect = [
  { label: '接入号:accessNumber', value: 'accessNumber:orient' },
  // 可以添加更多关联参数
  { label: '客户编码:cusNumber', value: 'cusNumber:orient' },
];

// 更新数据到 workflow 节点
function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
