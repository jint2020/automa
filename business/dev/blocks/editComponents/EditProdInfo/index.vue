<!--
 * @Description: 产品信息配置编辑组件
 * @Author: Jin Tang
 * @Date: 2025-12-17 17:07:39
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-12-18 16:51:10
-->
<template>
  <div class="edit-prod-info">
    <ui-card class="mb-4">
      <div class="mb-2 flex items-center justify-between">
        <p class="font-semibold">基础配置</p>
      </div>
      <edit-autocomplete class="mb-2 w-full">
        <ui-input
          :model-value="data.baseOrderSalesName"
          label="当前业务名称"
          placeholder="如：主套餐"
          @change="updateData({ baseOrderSalesName: $event })"
        />
      </edit-autocomplete>
    </ui-card>

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
          <div class="mb-3 border rounded p-2">
            <div class="flex items-center space-x-1">
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

            <!-- 信息项类型和信息项值：仅当 type 为 infoItem 时显示 -->
            <div v-if="info.type === 'infoItem'" class="mt-2 ml-6 space-y-2">
              <ui-select
                :model-value="info.infoItemType"
                label="信息项类型"
                class="w-full"
                @change="updateInfoField(index, 'infoItemType', $event)"
              >
                <option
                  v-for="item in infoItemTypeOptions"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </option>
              </ui-select>

              <edit-autocomplete class="w-full">
                <ui-input
                  :model-value="info.infoItemValue"
                  label="信息项值"
                  placeholder="支持 {{ variable }}"
                  class="w-full"
                  @change="updateInfoField(index, 'infoItemValue', $event)"
                />
              </edit-autocomplete>
            </div>
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

// 信息项类型选项
const infoItemTypeOptions = [
  { label: '文本输入', value: '文本输入:input' },
  { label: '下拉选择', value: '下拉选择:select' },
  {
    label: '下拉选择(失败自动跳过)',
    value: '下拉选择(失败自动跳过):selectIgnoreError',
  },
  {
    label: '下拉选择(原值为空才设置)',
    value: '下拉选择(原值为空才设置):selectIfNull',
  },
  { label: '选择地址组件', value: '选择地址组件:address-zujian' },
  {
    label: '关联使用人设置组件',
    value: '关联使用人设置组件:associatedUser-zujian',
  },
  { label: '缴费组件', value: '缴费组件:jiaofei-zujian' },
  { label: '发票设置', value: '发票设置:acctInvoiceInfoassociationParameter' },
  { label: '账单设置', value: '账单设置:billInfoassociationParameter' },
  {
    label: '服务关系-优惠中待提交订单',
    value: '服务关系-优惠中待提交订单:serviceRelationship-order',
  },
  {
    label: '服务关系-关联接入号',
    value: '服务关系-关联接入号:serviceRelationship-accNum',
  },
  { label: '选择学校（校园宽带专用）', value: '选择学校:choose-school' },
  { label: '选择学校（翼教云）', value: '选择学校(翼教云):choose-school-yjy' },
  { label: '身份证号码', value: '身份证号码:idCard-number' },
  { label: '群号码', value: '群号码:groupNumber' },
  { label: '融合VPDN群', value: '融合VPDN群:VPDN' },
  { label: '登记号码(优先报号)', value: '登记号码(优先报号):checkInNum' },
  { label: 'ICT子项目编码', value: 'ICT子项目编码:ICTProjectCode' },
  { label: '固话选号', value: '固话选号:fixedNumberChoose' },
  {
    label: '提取该产品信息到结果',
    value: '提取该产品信息到结果:fetchInformationToResult',
  },
  {
    label: '该流程接入号相关的CENTREX群组号',
    value: '该流程接入号相关的CENTREX群组号:CENTREX',
  },
  { label: '该订单的订单编码', value: '该订单的订单编码:orderCode' },
  { label: '查已有服务', value: '查已有服务:searchExistingService' },
  { label: '手机选号', value: '手机选号:selectPhoneNumber' },
  { label: '意向单查询', value: '意向单查询:searchIntentNo' },
  {
    label: '填入该流程的审批单号',
    value: '填入该流程的审批单号:fillInApprovalNumber',
  },
  {
    label: '设备回收（设备回收方式、回收终端序列）',
    value: '设备回收（设备回收方式、回收终端序列）:Recyclingequipment',
  },
  { label: 'UIM', value: 'UIM:UIM' },
  { label: '信息提示弹窗确认', value: '信息提示弹窗确认:alertclick' },
  { label: '选择短号', value: '选择短号:selectCornet' },
  { label: '选择综合VPN群', value: '选择综合VPN群:selectVPNGroup' },
  {
    label:
      "商务领航(群)BNET帐号开户（填写用户报装地址，ICT合同正式编码固定填'JXXYJTYHTBH000SLD'，填写揽装人渠道销售编码；关联参数请设置'用户报装地址'和'揽装人渠道销售编码'）",
    value:
      "商务领航(群)BNET帐号开户（填写用户报装地址，ICT合同正式编码固定填'JXXYJTYHTBH000SLD'，填写揽装人渠道销售编码；关联参数请设置'用户报装地址'和'揽装人渠道销售编码'）:BNET",
  },
  { label: '快捷宽带揽装人选择', value: '快捷宽带揽装人选择:lzrChoose' },
  {
    label: '可订购快捷宽带礼包ID选择',
    value: '可订购快捷宽带礼包ID选择:packageChoose',
  },
  { label: '密码录入', value: '密码录入:ServicePassword' },
  {
    label: '文本输入（加0757前缀）',
    value: '文本输入（加0757前缀）:input0757',
  },
  {
    label:
      '判断用户填入的时间是否大于当前时间七天，如果不大于则填入当前日期的往后第七天',
    value:
      '判断用户填入的时间是否大于当前时间七天，如果不大于则填入当前日期的往后第七天:inputSevenDay',
  },
];

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
      infoItemType: '',
      infoItemValue: '',
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
