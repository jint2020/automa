<!--
 * @Description: 产品信息配置编辑组件
 * @Author: Jin Tang
 * @Date: 2025-12-17 17:07:39
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-12-17 17:19:13
-->
<template>
  <div class="edit-prod-info">
    <ui-card class="flex-col">
      <div class="mb-2 flex items-center justify-between">
        <p class="font-semibold">产品信息配置列表</p>
        <span class="text-sm text-gray-600">
          ({{ productInfoList.length }} 项目)
        </span>
      </div>

      <!-- Product info list with drag & drop -->
      <Draggable
        v-model="productInfoList"
        tag="div"
        item-key="key"
        handle=".handle"
      >
        <template #item="{ element: info, index }">
          <div class="mb-2 flex items-center space-x-1">
            <!-- Drag handle -->
            <v-remixicon
              v-tooltip="'拖动排序'"
              name="mdiDrag"
              class="handle cursor-move text-gray-400 flex-shrink-0"
            />

            <!-- Index -->
            <span class="text-sm text-gray-500 flex-shrink-0 w-4">{{
              index + 1
            }}</span>

            <!-- Type Selection -->
            <ui-select
              :model-value="info.type"
              placeholder="类型"
              class="w-28 flex-shrink-0"
              @change="updateInfoField(index, 'type', $event)"
            >
              <option value="check">勾选</option>
              <option value="uncheck">不选</option>
              <option value="infoItem">信息项</option>
            </ui-select>

            <!-- Value (supports template variables) -->
            <edit-autocomplete class="flex-1 w-full">
              <ui-input
                :model-value="info.value"
                placeholder="目标属性名称，支持 {{ variables }}"
                class="w-full"
                @change="updateInfoField(index, 'value', $event)"
              />
            </edit-autocomplete>

            <!-- Delete button -->
            <ui-button
              v-if="productInfoList.length > 1"
              v-tooltip="'删除'"
              icon
              class="flex-shrink-0"
              @click="removeInfo(index)"
            >
              <v-remixicon name="riDeleteBin7Line" />
            </ui-button>
          </div>
        </template>
      </Draggable>

      <!-- Add button -->
      <ui-button class="w-full" variant="accent" @click="addInfo">
        <v-remixicon name="riAddLine" class="mr-1 -ml-1" />
        增加产品信息
      </ui-button>
    </ui-card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Draggable from 'vuedraggable';
import EditAutocomplete from '@/components/newtab/workflow/edit/EditAutocomplete.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:data']);

// Update data to workflow node
function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

// Computed property: get product info array
const productInfoList = computed({
  get() {
    return props.data.productInfo || [];
  },
  set(value) {
    // 自动更新 order 字段以反映新的拖拽顺序
    const updatedValue = value.map((info, index) => ({
      ...info,
      order: index,
    }));
    updateData({ productInfo: updatedValue });
  },
});

// Update field in info item
function updateInfoField(index, field, value) {
  const updatedInfos = [...productInfoList.value];
  updatedInfos[index] = {
    ...updatedInfos[index],
    [field]: value,
  };
  productInfoList.value = updatedInfos;
}

// Generate unique key for new items
function generateKey() {
  return `prod-info-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;
}

// Add new info item
function addInfo() {
  const updatedInfos = [
    ...productInfoList.value,
    {
      type: '',
      key: generateKey(),
      value: '',
      order: productInfoList.value.length,
    },
  ];
  productInfoList.value = updatedInfos;
}

// Remove info item (keep at least one)
function removeInfo(index) {
  if (productInfoList.value.length <= 1) {
    return;
  }
  const updatedInfos = [...productInfoList.value];
  updatedInfos.splice(index, 1);
  // Update order after removal
  const reorderedInfos = updatedInfos.map((info, idx) => ({
    ...info,
    order: idx,
  }));
  productInfoList.value = reorderedInfos;
}
</script>
