<template>
  <div class="edit-telecom-package-subscription">
    <!-- 基础配置 -->
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">基础配置</p>

      <ui-checkbox
        :model-value="data.isZtSource"
        class="mb-2"
        @change="updateData({ isZtSource: $event })"
      >
        中台来源数据（跳过黄金/白金会员）
      </ui-checkbox>

      <ui-checkbox
        :model-value="data.mutualExclusionCheck"
        class="mb-2"
        @change="updateData({ mutualExclusionCheck: $event })"
      >
        通过销售品互斥校验
      </ui-checkbox>

      <ui-checkbox
        :model-value="data.skipValidation"
        class="mb-2"
        @change="updateData({ skipValidation: $event })"
      >
        跳过校验
      </ui-checkbox>
    </ui-card>

    <!-- 产品列表 -->
    <ui-card class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <p class="font-semibold">产品列表</p>
        <ui-button size="small" @click="addProduct">
          <v-remixicon name="riAddLine" class="mr-1" />
          添加产品
        </ui-button>
      </div>

      <div
        v-if="data.productList && data.productList.length > 0"
        class="space-y-4"
      >
        <div
          v-for="(product, index) in data.productList"
          :key="index"
          class="border rounded p-3"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">产品 {{ index + 1 }}</span>
            <ui-button
              size="small"
              variant="danger"
              @click="removeProduct(index)"
            >
              <v-remixicon name="riDeleteBin7Line" />
            </ui-button>
          </div>

          <edit-autocomplete class="mb-2 w-full">
            <ui-input
              :model-value="product.offerCode"
              label="销售品编码"
              placeholder="如：YD5G02-211-1-1 或 自动获取"
              @change="updateProduct(index, { offerCode: $event })"
            />
          </edit-autocomplete>

          <ui-input
            :model-value="product.productName"
            label="产品名称"
            placeholder="如：中国电信移动电话"
            class="mb-2 w-full"
            @change="updateProduct(index, { productName: $event })"
          />

          <ui-input
            :model-value="product.productType"
            label="产品类型"
            placeholder="如：基础移动电话"
            class="mb-2 w-full"
            @change="updateProduct(index, { productType: $event })"
          />

          <ui-select
            :model-value="product.handlerType"
            label="操作类型"
            class="mb-2 w-full"
            @change="updateProduct(index, { handlerType: $event })"
          >
            <option value="订购:productAction">订购</option>
            <option value="加入:productAction">加入</option>
            <option value="关联参数不为空则加入:productAction">
              关联参数不为空则加入
            </option>
            <option value="加入类型存在则加入:productAction">
              加入类型存在则加入
            </option>
            <option value="其它:productAction">其它</option>
            <option value="关联参数不为空则其它:productAction">
              关联参数不为空则其它
            </option>
            <option value="清除:productAction">清除</option>
            <option value="不处理:productAction">不处理</option>
          </ui-select>

          <!-- 加入操作相关参数 -->
          <template v-if="product.handlerType?.includes('加入')">
            <edit-autocomplete class="mb-2 w-full">
              <ui-input
                :model-value="product.addAccessNo"
                label="加入的号码"
                placeholder="如：13800138000 或 key-phone"
                @change="updateProduct(index, { addAccessNo: $event })"
              />
            </edit-autocomplete>

            <ui-input
              :model-value="product.addAccessType"
              label="加入的业务名称"
              placeholder="如：天翼宽带拨号(原ADSL拨号)"
              class="mb-2 w-full"
              @change="updateProduct(index, { addAccessType: $event })"
            />
          </template>

          <!-- 其它操作相关参数 -->
          <template v-if="product.handlerType?.includes('其它')">
            <edit-autocomplete class="mb-2 w-full">
              <ui-input
                :model-value="product.otherAccessNo"
                label="其它操作的查询号码"
                placeholder="如：13800138000"
                @change="updateProduct(index, { otherAccessNo: $event })"
              />
            </edit-autocomplete>

            <ui-input
              :model-value="product.otherQryType"
              label="其它操作的查询类型"
              placeholder="如：接入号"
              class="mb-2 w-full"
              @change="updateProduct(index, { otherQryType: $event })"
            />
          </template>

          <!-- 清除操作相关参数 -->
          <template v-if="product.handlerType === '清除:productAction'">
            <edit-autocomplete class="mb-2 w-full">
              <ui-input
                :model-value="product.minusNo"
                label="清除操作的号码"
                placeholder="如：13800138000"
                @change="updateProduct(index, { minusNo: $event })"
              />
            </edit-autocomplete>
          </template>

          <ui-checkbox
            :model-value="product.mutualExclusionCheck"
            class="mt-2"
            @change="updateProduct(index, { mutualExclusionCheck: $event })"
          >
            该产品通过互斥校验
          </ui-checkbox>
        </div>
      </div>

      <p v-else class="text-sm text-gray-500 text-center py-4">
        暂无产品，点击"添加产品"按钮开始配置
      </p>
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

function addProduct() {
  const productList = [...(props.data.productList || [])];
  productList.push({
    offerCode: '',
    productName: '',
    productType: '',
    handlerType: '订购:productAction',
    addAccessNo: '',
    addAccessType: '',
    otherAccessNo: '',
    otherQryType: '',
    minusNo: '',
    mutualExclusionCheck: false,
  });
  updateData({ productList });
}

function removeProduct(index) {
  const productList = [...(props.data.productList || [])];
  productList.splice(index, 1);
  updateData({ productList });
}

function updateProduct(index, value) {
  const productList = [...(props.data.productList || [])];
  productList[index] = { ...productList[index], ...value };
  updateData({ productList });
}
</script>
