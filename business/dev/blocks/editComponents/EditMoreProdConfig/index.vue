<template>
  <div class="edit-more-prod-config">
    <ui-card class="flex-col">
      <div class="mb-2 flex items-center justify-between">
        <p class="font-semibold">更多销售品配置列表</p>
        <span class="text-sm text-gray-600">
          ({{ productConfigs.length }} 项目)
        </span>
      </div>

      <!-- Product configuration list -->
      <div
        v-for="(config, index) in productConfigs"
        :key="index"
        class="mb-4 rounded-lg border p-3"
      >
        <div class="mb-2 flex items-center justify-between">
          <span class="font-medium text-gray-700">销售品 {{ index + 1 }}</span>
          <ui-button
            v-if="productConfigs.length > 1"
            v-tooltip="'Remove this configuration'"
            icon
            @click="removeConfig(index)"
          >
            <v-remixicon name="riDeleteBin7Line" />
          </ui-button>
        </div>

        <!-- Product Code -->
        <label class="mb-1 block text-sm">更多销售品编码</label>
        <edit-autocomplete class="mb-3">
          <ui-input
            :model-value="config.moreSalesProductCode"
            placeholder="支持模板语法 {{ variables }}"
            class="w-full"
            @change="updateConfigField(index, 'moreSalesProductCode', $event)"
          />
        </edit-autocomplete>

        <!-- Clear Original Sales -->
        <ui-checkbox
          :model-value="config.clearOriginalSales"
          @change="updateConfigField(index, 'clearOriginalSales', $event)"
        >
          是否清除原销售品
        </ui-checkbox>
      </div>

      <!-- Add configuration button -->
      <ui-button class="w-full" variant="accent" @click="addConfig">
        <v-remixicon name="riAddLine" class="mr-1 -ml-1" />
        增加销售品配置
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

// Update data to workflow node
function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

// Computed property: get product config array
const productConfigs = computed({
  get() {
    return props.data.moreSalesProductConfig || [];
  },
  set(value) {
    updateData({ moreSalesProductConfig: value });
  },
});

// Update field in config item
function updateConfigField(index, field, value) {
  const updatedConfigs = [...productConfigs.value];
  updatedConfigs[index] = {
    ...updatedConfigs[index],
    [field]: value,
  };
  productConfigs.value = updatedConfigs;
}

// Add new configuration
function addConfig() {
  const updatedConfigs = [
    ...productConfigs.value,
    {
      moreSalesProductCode: '',
      clearOriginalSales: false,
    },
  ];
  productConfigs.value = updatedConfigs;
}

// Remove configuration (keep at least one)
function removeConfig(index) {
  if (productConfigs.value.length <= 1) {
    return; // Don't allow deleting the last config
  }
  const updatedConfigs = [...productConfigs.value];
  updatedConfigs.splice(index, 1);
  productConfigs.value = updatedConfigs;
}
</script>
