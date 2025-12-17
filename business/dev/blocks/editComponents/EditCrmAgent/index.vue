<template>
  <div class="edit-crm-agent">
    <!-- 联系人信息 -->
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">联系人信息</p>

      <ui-checkbox
        :model-value="!!data.linkMan"
        class="mb-2"
        @change="handleCheckboxChange('linkMan', $event)"
      >
        联系人
      </ui-checkbox>

      <ui-checkbox
        :model-value="!!data.linkPhone"
        class="mb-2"
        @change="handleCheckboxChange('linkPhone', $event)"
      >
        联系电话
      </ui-checkbox>
    </ui-card>

    <!-- 经办人配置 -->
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">经办人配置</p>

      <ui-checkbox
        :model-value="!!data.handlerFindType"
        class="mb-2"
        @change="handleCheckboxChange('handlerFindType', $event)"
      >
        经办人查找类型
      </ui-checkbox>

      <ui-checkbox
        :model-value="!!data.handlerFindValue"
        class="mb-2"
        @change="handleCheckboxChange('handlerFindValue', $event)"
      >
        经办人查找值
      </ui-checkbox>

      <ui-checkbox
        :model-value="!!data.handlerType"
        class="mb-2"
        @change="handleCheckboxChange('handlerType', $event)"
      >
        经办人类型
      </ui-checkbox>
    </ui-card>

    <!-- 携带人配置 -->
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">携带人配置</p>

      <ui-checkbox
        :model-value="!!data.isHandlerCarryMan"
        class="mb-2"
        @change="handleCheckboxChange('isHandlerCarryMan', $event)"
      >
        经办人即携带人
      </ui-checkbox>

      <ui-checkbox
        :model-value="!!data.carryManFindType"
        class="mb-2"
        @change="handleCheckboxChange('carryManFindType', $event)"
      >
        携带人查找类型
      </ui-checkbox>

      <ui-checkbox
        :model-value="!!data.carryManFindValue"
        class="mb-2"
        @change="handleCheckboxChange('carryManFindValue', $event)"
      >
        携带人查找值
      </ui-checkbox>

      <ui-checkbox
        :model-value="!!data.carryManFindType1"
        class="mb-2"
        @change="handleCheckboxChange('carryManFindType1', $event)"
      >
        携带人查找类型1
      </ui-checkbox>

      <ui-checkbox
        :model-value="!!data.carryManFindValue1"
        class="mb-2"
        @change="handleCheckboxChange('carryManFindValue1', $event)"
      >
        携带人查找值1
      </ui-checkbox>

      <ui-checkbox
        :model-value="!!data.carryManFindType2"
        class="mb-2"
        @change="handleCheckboxChange('carryManFindType2', $event)"
      >
        携带人查找类型2
      </ui-checkbox>

      <ui-checkbox
        :model-value="!!data.carryManFindValue2"
        class="mb-2"
        @change="handleCheckboxChange('carryManFindValue2', $event)"
      >
        携带人查找值2
      </ui-checkbox>
    </ui-card>

    <!-- 其他配置 -->
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">其他配置</p>

      <ui-checkbox
        :model-value="!!data.orderRemark"
        class="mb-2"
        @change="handleCheckboxChange('orderRemark', $event)"
      >
        订单备注
      </ui-checkbox>

      <ui-checkbox
        :model-value="!!data.bookTime"
        class="mb-2"
        @change="handleCheckboxChange('bookTime', $event)"
      >
        预约时间
      </ui-checkbox>

      <ui-checkbox
        :model-value="!!data.convertToZeroSignalControl"
        class="mb-2"
        @change="handleCheckboxChange('convertToZeroSignalControl', $event)"
      >
        转零信号控制
      </ui-checkbox>
    </ui-card>

    <hr />

    <!-- 变量赋值 -->
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

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

// 处理checkbox变更，将勾选转换为变量模板字符串
function handleCheckboxChange(fieldName, checked) {
  const value = checked ? `{{variables.${fieldName}}}` : false;
  updateData({ [fieldName]: value });
}
</script>
