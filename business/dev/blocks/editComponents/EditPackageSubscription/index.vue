<template>
  <div class="edit-package-subscription">
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
          <div
            v-if="data.productList.length > 1"
            class="flex items-center justify-between mb-2"
          >
            <span class="text-sm font-medium">产品 {{ index + 1 }}</span>
            <ui-button size="small" @click="removeProduct(index)">
              <v-remixicon name="riDeleteBin7Line" />
            </ui-button>
          </div>

          <edit-autocomplete class="mb-2 w-full">
            <ui-input
              :model-value="product.offerCode"
              label="销售品编码"
              placeholder="如：YD5G02-211-1-1，支持 {{ variable }}"
              @change="updateProduct(index, { offerCode: $event })"
            />
          </edit-autocomplete>

          <ui-select
            :model-value="product.productType"
            label="产品类型"
            class="mb-2 w-full"
            @change="updateProduct(index, { productType: $event })"
          >
            <option
              v-for="item in productTypeOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </option>
          </ui-select>

          <ui-select
            :model-value="product.productName"
            label="产品名称"
            class="mb-2 w-full"
            @change="updateProduct(index, { productName: $event })"
          >
            <option
              v-for="item in productNameOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </option>
          </ui-select>

          <ui-select
            :model-value="product.action"
            label="具体动作"
            class="mb-2 w-full"
            @change="updateProduct(index, { action: $event })"
          >
            <option
              v-for="item in actionOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </option>
          </ui-select>

          <!-- 加入类型：当动作包含"加入"时显示 -->
          <ui-select
            v-if="product.action?.includes('加入')"
            :model-value="product.addAccessType"
            label="加入类型"
            class="mb-2 w-full"
            @change="updateProduct(index, { addAccessType: $event })"
          >
            <option
              v-for="item in addAccessTypeOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </option>
          </ui-select>

          <edit-autocomplete class="mb-2 w-full">
            <ui-input
              :model-value="product.relatedParam"
              label="关联参数"
              placeholder="如：13800138000，支持 {{ variable }}"
              @change="updateProduct(index, { relatedParam: $event })"
            />
          </edit-autocomplete>
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

// 产品类型选项
const productTypeOptions = [
  { label: '自动选择', value: '自动选择:autoType' },
  { label: '基础有线宽带', value: '基础有线宽带:productType' },
  { label: '基础移动电话', value: '基础移动电话:productType' },
  { label: '加装移动电话', value: '加装移动电话:productType' },
  { label: '基础ITV', value: '基础ITV:productType' },
  { label: '基础功能应用（新增）', value: '基础功能应用（新增）:productType' },
  { label: '基础智能组网', value: '基础智能组网:productType' },
  { label: '基础智能家居', value: '基础智能家居:productType' },
  { label: '基础固话', value: '基础固话:productType' },
  { label: '服务类', value: '服务类:productType' },
  { label: '信息搜索类', value: '信息搜索类:productType' },
  { label: '智能家居', value: '智能家居:productType' },
  { label: '加装亲情包群', value: '加装亲情包群:productType' },
  { label: '电子商务', value: '电子商务:productType' },
  { label: '查询号码付费类型', value: '查询号码付费类型:productType' },
  { label: '信息服务', value: '信息服务:productType' },
  { label: '智能组网（商企版）', value: '智能组网（商企版）:productType' },
  { label: '基础天翼云甄选商城', value: '基础天翼云甄选商城:productType' },
  { label: '基础增值', value: '基础增值:productType' },
  { label: '通信信息助理类', value: '通信信息助理类:productType' },
  { label: '云计算', value: '云计算:productType' },
  { label: '加装ITV', value: '加装ITV:productType' },
  { label: '基础智家服务', value: '基础智家服务:productType' },
  { label: '企业信息化', value: '企业信息化:productType' },
  { label: '基础桌面云', value: '基础桌面云:productType' },
  { label: '基础云盘', value: '基础云盘:productType' },
  {
    label: '基础天翼云眼（视频云网行业版）',
    value: '基础天翼云眼（视频云网行业版）:productType',
  },
  {
    label: '基础数字乡村综合信息服务平台',
    value: '基础数字乡村综合信息服务平台:productType',
  },
];

// 产品名称选项
const productNameOptions = [
  { label: '自动选择', value: '自动选择:autoType' },
  {
    label: '天翼宽带拨号(原ADSL拨号)',
    value: '天翼宽带拨号(原ADSL拨号):productName',
  },
  { label: '校园天翼宽带', value: '校园天翼宽带:productName' },
  { label: '预付费校园天翼宽带', value: '预付费校园天翼宽带:productName' },
  { label: '查询号码付费类型', value: '查询号码付费类型:productName' },
  { label: '中国电信移动电话', value: '中国电信移动电话:productName' },
  {
    label: '中国电信预付费移动电话',
    value: '中国电信预付费移动电话:productName',
  },
  { label: '广东IPTV', value: '广东IPTV:productName' },
  { label: '广东IPTV子账号', value: '广东IPTV子账号:productName' },
  { label: '智能组网', value: '智能组网:productName' },
  { label: '全屋WiFi', value: '全屋WiFi:productName' },
  { label: '全屋WiFi/智能组网', value: '全屋WiFi/智能组网:productName' },
  { label: '普通电话', value: '普通电话:productName' },
  {
    label: '天翼看家（家庭云版）云存储',
    value: '天翼看家（家庭云版）云存储:productName',
  },
  { label: '极速专线', value: '极速专线:productName' },
  { label: '应用专线', value: '应用专线:productName' },
  { label: '智能名片', value: '智能名片:productName' },
  { label: '智能家居', value: '智能家居:productName' },
  { label: 'CENTREX普通电话', value: 'CENTREX普通电话:productName' },
  { label: '天翼云呼', value: '天翼云呼:productName' },
  { label: 'WIFI增值产品系列', value: 'WIFI增值产品系列:productName' },
  { label: '微派（单产品）', value: '微派（单产品）:productName' },
  { label: '智能组网（商企版）', value: '智能组网（商企版）:productName' },
  { label: '公共宽带线路', value: '公共宽带线路:productName' },
  {
    label: '天翼宽带预付费拨号(原预付费ADSL拨号)',
    value: '天翼宽带预付费拨号(原预付费ADSL拨号):productName',
  },
  { label: 'MPLSVPN', value: 'MPLSVPN:productName' },
  { label: '预付费广东IPTV', value: '预付费广东IPTV:productName' },
  { label: '天翼云甄选商城', value: '天翼云甄选商城:productName' },
  { label: '摄像枪端', value: '摄像枪端:productName' },
  {
    label: '天翼看家-乡镇版/天翼云眼',
    value: '天翼看家-乡镇版/天翼云眼:productName',
  },
  { label: '视频云网专线', value: '视频云网专线:productName' },
  { label: '挂机短信', value: '挂机短信:productName' },
  { label: '省内云主机（个性化）', value: '省内云主机（个性化）:productName' },
  { label: '快捷宽带', value: '快捷宽带:productName' },
  { label: '物联网应用服务', value: '物联网应用服务:productName' },
  { label: '融合VPDN成员', value: '融合VPDN成员:productName' },
  { label: '翼教云', value: '翼教云:productName' },
  { label: '云卓面-服务', value: '云卓面-服务:productName' },
  { label: '云桌面-计算单元', value: '云桌面-计算单元:productName' },
  { label: '车路路信息服务', value: '车路路信息服务:productName' },
  { label: '班班通宽带', value: '班班通宽带:productName' },
  { label: '优先报号', value: '优先报号:productName' },
  { label: '天翼企业云盘领航版', value: '天翼企业云盘领航版:productName' },
  { label: '天翼云眼', value: '天翼云眼:productName' },
  {
    label: '数字乡村综合信息服务平台',
    value: '数字乡村综合信息服务平台:productName',
  },
];

// 具体动作选项
const actionOptions = [
  { label: '订购', value: '订购:productAction' },
  { label: '加入', value: '加入:productAction' },
  { label: '其它', value: '其它:productAction' },
  { label: '清除', value: '清除:productAction' },
  { label: '点击+号后订购', value: '点击+号后订购:productAction' },
  { label: '点击+号后加入', value: '点击+号后加入:productAction' },
  { label: '点击+号后其它', value: '点击+号后其它:productAction' },
];

// 加入类型选项
const addAccessTypeOptions = [
  {
    label: '销售品内产品-天翼宽带拨号(原ADSL拨号)',
    value: '销售品内产品-天翼宽带拨号(原ADSL拨号):productAddType',
  },
  { label: '融合宽带接入号', value: '融合宽带接入号:productAddType' },
  { label: '融合ITV接入号', value: '融合ITV接入号:productAddType' },
  { label: '融合智能组网接入号', value: '融合智能组网接入号:productAddType' },
  { label: '融合固话接入号', value: '融合固话接入号:productAddType' },
  { label: '新装智能家居', value: '新装智能家居:productAddType' },
  { label: '融合智能家居接入号', value: '融合智能家居接入号:productAddType' },
  {
    label: '新装预付费校园天翼宽带',
    value: '新装预付费校园天翼宽带:productAddType',
  },
  { label: '新装副卡接入号', value: '新装副卡接入号:productAddType' },
  { label: '新装主卡接入号', value: '新装主卡接入号:productAddType' },
  {
    label: 'WIFI增值产品系列订购',
    value: 'WIFI增值产品系列订购:productAddType',
  },
  { label: '新装微派（单产品）', value: '新装微派（单产品）:productAddType' },
  {
    label: '智能组网（商企版）订购',
    value: '智能组网（商企版）订购:productAddType',
  },
  { label: '天翼云甄选商城订购', value: '天翼云甄选商城订购:productAddType' },
  { label: '新装预付费宽带', value: '新装预付费宽带:productAddType' },
  { label: '新装预付费广东IPTV', value: '新装预付费广东IPTV:productAddType' },
  { label: '新装摄像枪端', value: '新装摄像枪端:productAddType' },
  {
    label: '天翼看家-乡镇版/天翼云眼订购',
    value: '天翼看家-乡镇版/天翼云眼订购:productAddType',
  },
  { label: '视频云网专线订购', value: '视频云网专线订购:productAddType' },
  { label: '新装挂机短信', value: '新装挂机短信:productAddType' },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function addProduct() {
  const productList = [...(props.data.productList || [])];
  productList.push({
    offerCode: '',
    productType: '',
    productName: '',
    action: '',
    addAccessType: '',
    relatedParam: '',
  });
  updateData({ productList });
}

function removeProduct(index) {
  const productList = [...(props.data.productList || [])];
  if (productList.length <= 1) {
    return;
  }
  productList.splice(index, 1);
  updateData({ productList });
}

function updateProduct(index, value) {
  const productList = [...(props.data.productList || [])];
  productList[index] = { ...productList[index], ...value };
  updateData({ productList });
}
</script>
