<template>
  <div class="edit-telecom-package-operate">
    <!-- 套餐定位配置 -->
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">套餐定位条件</p>

      <edit-autocomplete class="mb-2 w-full">
        <ui-input
          :model-value="data.packageName"
          label="套餐名称"
          placeholder="如：5G畅享套餐"
          @change="updateData({ packageName: $event })"
        />
      </edit-autocomplete>

      <edit-autocomplete class="mb-2 w-full">
        <ui-input
          :model-value="data.packageCode"
          label="套餐编码"
          placeholder="如：YD5G01-001-1-1 或 YD5G01-001-1-1||YD5G01-002-1-1"
          @change="updateData({ packageCode: $event })"
        />
      </edit-autocomplete>

      <edit-autocomplete class="mb-2 w-full">
        <ui-input
          :model-value="data.objectList"
          label="对象列表"
          placeholder="如：主套餐"
          @change="updateData({ objectList: $event })"
        />
      </edit-autocomplete>

      <ui-select
        :model-value="data.packageType"
        label="套餐类型"
        class="mb-2 w-full"
        @change="updateData({ packageType: $event })"
      >
        <option value="">请选择套餐类型</option>
        <option value="促销:salesPromotion">促销</option>
        <option value="套餐销售品:packSale">套餐销售品</option>
        <option value="可选包:optionalPack">可选包</option>
      </ui-select>
    </ui-card>

    <!-- 操作配置 -->
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">操作配置</p>

      <ui-select
        :model-value="data.operate"
        label="操作类型"
        class="mb-2 w-full"
        @change="updateData({ operate: $event })"
      >
        <option value="预存续约:preStoreRenewal">预存续约</option>
        <option value="退订:td">退订</option>
        <option value="拆机登记:disassembleRegister">拆机登记</option>
        <option value="极简订购:simplestBook">极简订购</option>
        <option value="变更:change">变更</option>
        <option value="客户资料变更:custInfoChange">客户资料变更</option>
        <option value="回执:receipt">回执</option>
        <option value="详情:details">详情</option>
      </ui-select>

      <ui-checkbox
        :model-value="data.filterExpired"
        class="mb-2"
        @change="updateData({ filterExpired: $event })"
      >
        过滤过期套餐
      </ui-checkbox>

      <ui-checkbox
        :model-value="data.handleSkipValidation"
        class="mb-2"
        @change="updateData({ handleSkipValidation: $event })"
      >
        处理跳过校验
      </ui-checkbox>

      <ui-checkbox
        :model-value="data.handleOfflineProduct"
        class="mb-2"
        @change="updateData({ handleOfflineProduct: $event })"
      >
        处理下线产品提示
      </ui-checkbox>
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

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
