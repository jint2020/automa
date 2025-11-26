<template>
  <div class="edit-crm-get-customer">
    <!-- API配置 -->
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">查询条件</p>

      <ui-select
        v-model="data.queryType"
        label="查询类型"
        placeholder="请选择查询类型"
        class="mb-2"
        :items="[{ label: '接入号', value: 'accessNumber' }]"
        @update:model-value="toggleField(field.value, $event)"
      />

      <ui-select
        v-model="data.queryParams"
        label="查询值关联参数"
        placeholder="请选择查询值关联参数"
        :items="[
          { label: '接入号:accessNumber', value: 'accessNumber:orient' },
        ]"
        @update:model-value="toggleField(field.value, $event)"
      />
    </ui-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:data']);

function toggleField(fieldValue, checked) {
  const fields = [...props.data.fields];
  if (checked && !fields.includes(fieldValue)) {
    fields.push(fieldValue);
  } else if (!checked) {
    const index = fields.indexOf(fieldValue);
    if (index > -1) fields.splice(index, 1);
  }

  emit('update:data', {
    ...props.data,
    fields,
  });
}
</script>
