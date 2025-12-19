<!--
 * @Description: 订单提交编辑组件
 * @Author: Jin Tang
 * @Date: 2025-12-19
-->
<template>
  <div class="edit-submit-order">
    <!-- 基础配置 -->
    <ui-card class="mb-4">
      <div class="mb-2 flex items-center justify-between">
        <p class="font-semibold">基础配置</p>
      </div>

      <ui-select
        :model-value="data.isPay"
        label="是否收费订单"
        class="mb-2 w-full"
        @change="updateData({ isPay: $event })"
      >
        <option value="0">不收费</option>
        <option value="1">收费</option>
      </ui-select>

      <ui-select
        :model-value="data.feedbackNo"
        label="返回编码类型"
        class="mb-2 w-full"
        @change="updateData({ feedbackNo: $event })"
      >
        <option value="申请单编码:reqNo">申请单编码</option>
        <option value="订单编码:orderNo">订单编码</option>
      </ui-select>

      <ui-select
        :model-value="data.isMinimalismOrderParam"
        label="是否极简订购"
        class="mb-2 w-full"
        @change="updateData({ isMinimalismOrderParam: $event })"
      >
        <option value="">自动判断</option>
        <option value="1">是</option>
        <option value="0">否</option>
      </ui-select>

      <edit-autocomplete class="mb-2 w-full">
        <ui-input
          :model-value="data.userName"
          label="限流模式用户名"
          placeholder="支持 {{ variable }}"
          @change="updateData({ userName: $event })"
        />
      </edit-autocomplete>
    </ui-card>

    <!-- 提交选项 -->
    <ui-card class="mb-4">
      <div class="mb-2 flex items-center justify-between">
        <p class="font-semibold">提交选项</p>
      </div>

      <ui-checkbox
        :model-value="data.confirmSubmit"
        class="mb-2"
        @change="updateData({ confirmSubmit: $event })"
      >
        执行确认提交操作
      </ui-checkbox>

      <ui-checkbox
        :model-value="data.skipPhoneNumberQuantityReview"
        class="mb-2"
        @change="updateData({ skipPhoneNumberQuantityReview: $event })"
      >
        自动跳过电话号码数量审核
      </ui-checkbox>

      <ui-input
        :model-value="data.waitTimeAfterSubmit"
        label="提交后等待时间（秒）"
        type="number"
        class="mb-2 w-full"
        @change="updateData({ waitTimeAfterSubmit: Number($event) })"
      />
    </ui-card>

    <!-- 工单竣工配置 -->
    <ui-card class="mb-4">
      <div class="mb-2 flex items-center justify-between">
        <p class="font-semibold">工单竣工</p>
      </div>

      <ui-checkbox
        :model-value="data.completed"
        class="mb-2"
        @change="updateData({ completed: $event })"
      >
        查询工单竣工状态
      </ui-checkbox>

      <ui-input
        v-if="data.completed"
        :model-value="data.waitTime"
        label="竣工等待时间（秒）"
        type="number"
        class="mb-2 w-full"
        @change="updateData({ waitTime: Number($event) })"
      />
    </ui-card>

    <!-- 订单作废配置 -->
    <ui-card class="mb-4">
      <div class="mb-2 flex items-center justify-between">
        <p class="font-semibold">订单作废</p>
      </div>

      <ui-checkbox
        :model-value="data.invalid"
        class="mb-2"
        @change="handleInvalidChange"
      >
        主动作废订单
      </ui-checkbox>

      <div v-if="data.invalid" class="mb-2">
        <label class="text-sm text-gray-600">作废关键字列表</label>
        <div class="mt-1 space-y-1">
          <div
            v-for="(keyword, index) in invalidKeyList"
            :key="index"
            class="flex items-center space-x-1"
          >
            <ui-input
              :model-value="keyword"
              placeholder="关键字"
              class="flex-1"
              @change="updateInvalidKey(index, $event)"
            />
            <ui-button
              v-if="invalidKeyList.length > 0"
              icon
              @click="removeInvalidKey(index)"
            >
              <v-remixicon name="riDeleteBin7Line" />
            </ui-button>
          </div>
        </div>
        <ui-button class="mt-2 w-full" variant="accent" @click="addInvalidKey">
          <v-remixicon name="riAddLine" class="mr-1 -ml-1" />
          添加关键字
        </ui-button>
      </div>
    </ui-card>

    <!-- 外呼工单配置 -->
    <ui-card class="mb-4">
      <div class="mb-2 flex items-center justify-between">
        <p class="font-semibold">外呼工单</p>
      </div>

      <ui-checkbox
        :model-value="data.outboundAgents"
        class="mb-2"
        @change="updateData({ outboundAgents: $event })"
      >
        启用外呼工单
      </ui-checkbox>

      <edit-autocomplete v-if="data.outboundAgents" class="mb-2 w-full">
        <ui-input
          :model-value="data.outboundWorkNo"
          label="外呼工单号"
          placeholder="支持 {{ variable }}"
          @change="updateData({ outboundWorkNo: $event })"
        />
      </edit-autocomplete>
    </ui-card>

    <!-- 回执配置 -->
    <ui-card class="mb-4">
      <div class="mb-2 flex items-center justify-between">
        <p class="font-semibold">回执配置</p>
      </div>

      <ui-select
        :model-value="data.ifMandatoryReceipt"
        label="强制打印回执"
        class="w-full"
        @change="updateData({ ifMandatoryReceipt: $event })"
      >
        <option value="0">否</option>
        <option value="1">是</option>
      </ui-select>
    </ui-card>

    <!-- 订单结果获取 -->
    <ui-card>
      <div class="mb-2 flex items-center justify-between">
        <p class="font-semibold">订单结果获取</p>
        <span class="text-sm text-gray-600">
          ({{ variableMapList.length }} 项)
        </span>
      </div>

      <div class="space-y-2">
        <div
          v-for="(item, index) in variableMapList"
          :key="index"
          class="border rounded p-2"
        >
          <div class="flex items-center space-x-1 mb-2">
            <ui-input
              :model-value="item.name"
              placeholder="变量名"
              class="flex-1"
              @change="updateVariableMap(index, 'name', $event)"
            />
            <ui-button icon @click="removeVariableMap(index)">
              <v-remixicon name="riDeleteBin7Line" />
            </ui-button>
          </div>
          <edit-autocomplete class="w-full">
            <ui-input
              :model-value="item.value"
              placeholder="XPath或业务操作名，支持 {{ variable }}"
              class="w-full"
              @change="updateVariableMap(index, 'value', $event)"
            />
          </edit-autocomplete>
        </div>
      </div>

      <ui-button class="mt-2 w-full" variant="accent" @click="addVariableMap">
        <v-remixicon name="riAddLine" class="mr-1 -ml-1" />
        添加结果获取
      </ui-button>
    </ui-card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import EditAutocomplete from '@/components/newtab/workflow/edit/EditAutocomplete.vue';

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

// 处理主动作废订单 checkbox 变化
function handleInvalidChange(value) {
  if (value) {
    // 勾选时，如果列表为空则添加一个空元素
    const currentList = props.data.invalidKey || [];
    if (currentList.length === 0) {
      updateData({ invalid: true, invalidKey: [''] });
    } else {
      updateData({ invalid: true });
    }
  } else {
    // 取消勾选时清空作废关键字列表
    updateData({ invalid: false, invalidKey: [] });
  }
}

// 作废关键字列表
const invalidKeyList = computed({
  get() {
    return props.data.invalidKey || [];
  },
  set(value) {
    updateData({ invalidKey: value });
  },
});

function addInvalidKey() {
  invalidKeyList.value = [...invalidKeyList.value, ''];
}

function updateInvalidKey(index, value) {
  const updated = [...invalidKeyList.value];
  updated[index] = value;
  invalidKeyList.value = updated;
}

function removeInvalidKey(index) {
  const updated = [...invalidKeyList.value];
  updated.splice(index, 1);
  invalidKeyList.value = updated;
}

// 变量映射列表
const variableMapList = computed({
  get() {
    return props.data.variableMap || [];
  },
  set(value) {
    updateData({ variableMap: value });
  },
});

function addVariableMap() {
  variableMapList.value = [...variableMapList.value, { name: '', value: '' }];
}

function updateVariableMap(index, field, value) {
  const updated = [...variableMapList.value];
  updated[index] = { ...updated[index], [field]: value };
  variableMapList.value = updated;
}

function removeVariableMap(index) {
  const updated = [...variableMapList.value];
  updated.splice(index, 1);
  variableMapList.value = updated;
}
</script>
