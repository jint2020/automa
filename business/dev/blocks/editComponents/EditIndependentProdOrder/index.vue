<template>
  <div class="edit-independent-prod-order">
    <!-- 基础配置 -->
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">基础配置</p>

      <ui-checkbox
        :model-value="data.isZtSource"
        class="mb-2"
        @change="updateData({ isZtSource: $event })"
      >
        中台来源数据（自动跳过黄金/白金会员）
      </ui-checkbox>

      <ui-checkbox
        :model-value="data.skipCurrentProcess"
        class="mb-2"
        @change="updateData({ skipCurrentProcess: $event })"
      >
        跳过当前流程（处理业务提示弹窗）
      </ui-checkbox>

      <ui-checkbox
        :model-value="data.skipValidation"
        class="mb-2"
        @change="updateData({ skipValidation: $event })"
      >
        跳过校验
      </ui-checkbox>

      <ui-input
        :model-value="data.waitTimeout"
        label="等待超时时间（秒）"
        type="number"
        placeholder="5"
        class="mb-2"
        @change="updateData({ waitTimeout: +$event })"
      />
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

        <ui-textarea
          :model-value="formatArray(product.check)"
          label="需要勾选的可选包（每行一个）"
          placeholder="流量加油包&#10;语音优惠包"
          class="mb-2"
          @change="updateProduct(index, 'check', parseArray($event))"
        />

        <ui-textarea
          :model-value="formatArray(product.unCheck)"
          label="需要取消勾选的可选包（每行一个）"
          placeholder="国际漫游"
          @change="updateProduct(index, 'unCheck', parseArray($event))"
        />
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

// 格式化数组为字符串（每行一个）
function formatArray(arr) {
  if (!Array.isArray(arr)) return '';
  return arr.join('\n');
}

// 解析字符串为数组（每行一个）
function parseArray(str) {
  if (!str || typeof str !== 'string') return [];
  return str
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
</script>
