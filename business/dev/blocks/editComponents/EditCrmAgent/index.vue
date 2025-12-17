<template>
  <div class="edit-crm-agent">
    <ui-card class="flex-col mb-4">
      <p class="font-semibold mb-2">经办人信息</p>
      <hr class="mb-3" />

      <!-- 动态渲染所有字段 -->
      <div v-for="field in fields" :key="field.key" class="mb-3">
        <ui-checkbox
          :model-value="isFieldEnabled(field.key)"
          @change="handleFieldToggle(field.key, $event)"
        >
          {{ field.label }}
        </ui-checkbox>

        <edit-autocomplete v-if="isFieldEnabled(field.key)" class="mt-1">
          <ui-input
            :model-value="data[field.key]"
            :placeholder="`输入${field.label}，支持 {{ variable }}`"
            class="w-full"
            @change="updateData({ [field.key]: $event })"
          />
        </edit-autocomplete>
      </div>
    </ui-card>
  </div>
</template>

<script setup>
import EditAutocomplete from '@/components/newtab/workflow/edit/EditAutocomplete.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:data']);

// 字段配置：根据新版字段映射
const fields = [
  { key: 'handlerNoassociationParameter', label: '经办人编码' },
  { key: 'handlerYxdassociationParameter', label: '经办人意向单号' },
  { key: 'carryManCode', label: '揽装人渠道销售编码' },
  { key: 'firstCoSellerCode', label: '第一协销人渠道销售编码' },
  { key: 'secondCoSellerCode', label: '第二协销人渠道销售编码' },
  { key: 'custName', label: '联系人' },
  { key: 'custPhone', label: '联系电话' },
  { key: 'isSelfHandlerassociationParameter', label: '经办人是否本人' },
  {
    key: 'convertedToZeroSignalControlUser',
    label: '是否套餐下所有移动号码转为零信控用户',
  },
  { key: 'bookTimeassociationParameter', label: '预约上门时间' },
  { key: 'bookRefuseReasonassociationParameter', label: '不预约原因' },
  { key: 'orderRemark', label: '备注' },
];

// 判断字段是否启用（null/undefined/false 表示未启用，空字符串表示已启用但未填写）
function isFieldEnabled(fieldKey) {
  const value = props.data[fieldKey];
  return value !== false && value !== null && value !== undefined;
}

// 更新数据到 workflow 节点
function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

// 处理字段启用/禁用切换
function handleFieldToggle(fieldKey, enabled) {
  if (enabled) {
    // 启用字段，设置为空字符串，让用户自己输入
    updateData({ [fieldKey]: '' });
  } else {
    // 禁用字段，设置为 undefined
    updateData({ [fieldKey]: undefined });
  }
}
</script>
