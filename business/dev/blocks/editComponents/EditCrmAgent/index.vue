<template>
  <div class="edit-crm-agent">
    <!-- 联系人信息 -->
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">经办人信息</p>

      <ui-checkbox
        :model-value="!!data.linkMan"
        class="mb-2"
        @change="handleCheckboxChange('linkMan', $event)"
      >
        联系人姓名
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
        经办人查询类型
      </ui-checkbox>

      <ui-checkbox
        :model-value="!!data.handlerFindValue"
        class="mb-2"
        @change="handleCheckboxChange('handlerFindValue', $event)"
      >
        经办人查询值
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
        是否处理揽装人信息
      </ui-checkbox>

      <ui-checkbox
        :model-value="!!data.carryManFindType"
        class="mb-2"
        @change="handleCheckboxChange('carryManFindType', $event)"
      >
        揽装人查询类型
      </ui-checkbox>

      <ui-checkbox
        :model-value="!!data.carryManFindValue"
        class="mb-2"
        @change="handleCheckboxChange('carryManFindValue', $event)"
      >
        揽装人查询值
      </ui-checkbox>

      <ui-checkbox
        :model-value="!!data.carryManFindType1"
        class="mb-2"
        @change="handleCheckboxChange('carryManFindType1', $event)"
      >
        第一协销人查询类型
      </ui-checkbox>

      <ui-checkbox
        :model-value="!!data.carryManFindValue1"
        class="mb-2"
        @change="handleCheckboxChange('carryManFindValue1', $event)"
      >
        第一协销人查询值
      </ui-checkbox>

      <ui-checkbox
        :model-value="!!data.carryManFindType2"
        class="mb-2"
        @change="handleCheckboxChange('carryManFindType2', $event)"
      >
        第二协销人查询类型
      </ui-checkbox>

      <ui-checkbox
        :model-value="!!data.carryManFindValue2"
        class="mb-2"
        @change="handleCheckboxChange('carryManFindValue2', $event)"
      >
        第二协销人查询值
      </ui-checkbox>
    </ui-card>

    <!-- 其他配置
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
    </ui-card> -->

    <!-- <hr /> -->

    <!-- 变量赋值 -->
    <!-- <insert-workflow-data :data="data" variables @update="updateData" /> -->
  </div>
</template>

<script setup>
// import InsertWorkflowData from '@/components/newtab/workflow/edit/InsertWorkflowData.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  // editor: {
  //   type: Object,
  //   default: () => ({}),
  // },
});

const emit = defineEmits(['update:data']);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

// 生成唯一ID
// function generateId() {
//   return `param-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
// }

// 查找并更新 trigger block
// function updateTriggerParameters(fieldName, checked) {
//   if (!props.editor || !props.editor.getNodes) {
//     console.warn('[CRM Agent] Editor or getNodes not available');
//     return;
//   }

//   // 查找 trigger block
//   const allNodes = props.editor.getNodes.value;

//   const triggerNode = allNodes.find((node) => node.label === 'trigger');

//   if (!triggerNode) {
//     return;
//   }

//   // 确定正确的数据路径
//   const triggerData = triggerNode.data?.data || triggerNode.data;
//   if (!triggerData) {
//     console.warn('[CRM Agent] Trigger data not found');
//     return;
//   }

//   // 初始化 parameters 如果不存在
//   if (!triggerData.parameters) {
//     triggerData.parameters = [];
//   }

//   const currentParameters = triggerData.parameters || [];
//   // console.log('[CRM Agent] Current parameters:', currentParameters);

//   if (checked) {
//     // 勾选：添加参数到 trigger 的 parameters 数组（如果不存在）
//     const existingParam = currentParameters.find((p) => p.name === fieldName);
//     if (!existingParam) {
//       const newParameter = {
//         id: generateId(),
//         data: {
//           required: true,
//         },
//         name: fieldName,
//         type: 'json',
//         description: '',
//         placeholder: 'Text',
//         defaultValue: `{{variables.${fieldName}}}`,
//       };
//       triggerData.parameters = [...currentParameters, newParameter];
//     }
//   } else {
//     // 取消勾选：从 trigger 的 parameters 数组中移除
//     triggerData.parameters = currentParameters.filter(
//       (p) => p.name !== fieldName
//     );
//   }
// }

// 处理checkbox变更，将勾选转换为变量模板字符串
function handleCheckboxChange(fieldName, checked) {
  const value = checked ? `{{variables.${fieldName}}}` : false;

  // 更新字段值
  updateData({ [fieldName]: value });

  // 同步更新 trigger block 的 parameters 数组
  // updateTriggerParameters(fieldName, checked);
}
</script>
