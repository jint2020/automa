<template>
  <div class="edit-independent-prod-order">
    <!-- 基础配置 -->
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">基础配置</p>

      <ui-checkbox
        :model-value="data.skikNoOrderFlag"
        class="mb-2"
        @change="updateData({ skikNoOrderFlag: $event })"
      >
        没有订购标识跳过当前流程
      </ui-checkbox>
    </ui-card>

    <!-- 销售品配置 -->
    <ui-card class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <p class="font-semibold">销售品配置</p>
        <ui-button size="small" @click="addProduct">
          <v-remixicon name="riAddLine" class="mr-1" />
          添加销售品
        </ui-button>
      </div>

      <div
        v-for="(product, index) in data.productInfo"
        :key="index"
        class="border rounded-lg p-3 mb-3"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium">销售品 {{ index + 1 }}</span>
          <ui-button
            v-if="data.productInfo.length > 1"
            size="small"
            variant="danger"
            @click="removeProduct(index)"
          >
            <v-remixicon name="riDeleteBinLine" />
          </ui-button>
        </div>

        <ui-input
          :model-value="product.offerCode"
          label="销售品编码"
          placeholder="例如：DM0001-536-1-7 或 DM0001-536-1-7（未命中则跳过）"
          class="mb-2"
          @change="updateProduct(index, 'offerCode', $event)"
        />

        <ui-input
          :model-value="product.offerName"
          label="销售品名称（可选，用于中台模式）"
          placeholder="例如：畅享套餐"
          class="mb-2"
          @change="updateProduct(index, 'offerName', $event)"
        />

        <!-- 勾选数组 -->
        <div class="mb-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">勾选</span>
            <ui-button size="small" @click="addCheckItem(index)">
              <v-remixicon name="riAddLine" class="mr-1" />
            </ui-button>
          </div>

          <div
            v-for="(checkItem, checkIndex) in product.check"
            :key="'check-' + index + '-' + checkIndex"
            class="flex items-center gap-2 mb-2"
          >
            <ui-input
              :model-value="checkItem"
              placeholder="请输入勾选项目"
              class="flex-1"
              @change="updateCheckItem(index, checkIndex, $event)"
            />
            <ui-button
              size="small"
              variant="danger"
              @click="removeCheckItem(index, checkIndex)"
            >
              <v-remixicon name="riDeleteBinLine" />
            </ui-button>
          </div>

          <p
            v-if="product.check.length === 0"
            class="text-gray-500 text-sm ml-2"
          >
            暂无勾选项目
          </p>
        </div>

        <!-- 取消勾选数组 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">不勾选</span>
            <ui-button size="small" @click="addUncheckItem(index)">
              <v-remixicon name="riAddLine" class="mr-1" />
            </ui-button>
          </div>

          <div
            v-for="(uncheckItem, uncheckIndex) in product.unCheck"
            :key="'uncheck-' + index + '-' + uncheckIndex"
            class="flex items-center gap-2 mb-2"
          >
            <ui-input
              :model-value="uncheckItem"
              placeholder="请输入取消勾选项目"
              class="flex-1"
              @change="updateUncheckItem(index, uncheckIndex, $event)"
            />
            <ui-button
              size="small"
              variant="danger"
              @click="removeUncheckItem(index, uncheckIndex)"
            >
              <v-remixicon name="riDeleteBinLine" />
            </ui-button>
          </div>

          <p
            v-if="product.unCheck.length === 0"
            class="text-gray-500 text-sm ml-2"
          >
            暂无取消勾选项目
          </p>
        </div>
      </div>

      <p v-if="data.productInfo.length === 0" class="text-gray-500 text-sm">
        暂无销售品配置，请点击"添加销售品"按钮
      </p>
    </ui-card>

    <hr />

    <!-- 变量赋值（如果需要） -->
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
  emit('update:data', { ...props.data, ...value });
}

// 添加销售品
function addProduct() {
  const newProductInfo = [
    ...props.data.productInfo,
    {
      offerCode: '',
      offerName: '',
      check: [],
      unCheck: [],
    },
  ];
  updateData({ productInfo: newProductInfo });
}

// 删除销售品
function removeProduct(index) {
  const newProductInfo = props.data.productInfo.filter((_, i) => i !== index);
  updateData({ productInfo: newProductInfo });
}

// 更新单个销售品
function updateProduct(index, field, value) {
  const newProductInfo = [...props.data.productInfo];
  newProductInfo[index] = {
    ...newProductInfo[index],
    [field]: value,
  };
  updateData({ productInfo: newProductInfo });
}

// 勾选数组操作
function addCheckItem(productIndex) {
  const newProductInfo = [...props.data.productInfo];
  newProductInfo[productIndex].check.push('');
  updateData({ productInfo: newProductInfo });
}

function removeCheckItem(productIndex, checkIndex) {
  const newProductInfo = [...props.data.productInfo];
  newProductInfo[productIndex].check.splice(checkIndex, 1);
  updateData({ productInfo: newProductInfo });
}

function updateCheckItem(productIndex, checkIndex, value) {
  const newProductInfo = [...props.data.productInfo];
  newProductInfo[productIndex].check[checkIndex] = value;
  updateData({ productInfo: newProductInfo });
}

// 取消勾选数组操作
function addUncheckItem(productIndex) {
  const newProductInfo = [...props.data.productInfo];
  newProductInfo[productIndex].unCheck.push('');
  updateData({ productInfo: newProductInfo });
}

function removeUncheckItem(productIndex, uncheckIndex) {
  const newProductInfo = [...props.data.productInfo];
  newProductInfo[productIndex].unCheck.splice(uncheckIndex, 1);
  updateData({ productInfo: newProductInfo });
}

function updateUncheckItem(productIndex, uncheckIndex, value) {
  const newProductInfo = [...props.data.productInfo];
  newProductInfo[productIndex].unCheck[uncheckIndex] = value;
  updateData({ productInfo: newProductInfo });
}
</script>
