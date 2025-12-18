<template>
  <div class="edit-telecom-preference-set-param">
    <!-- 基础配置 -->
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">基础配置</p>

      <ui-checkbox
        :model-value="data.isZtSource"
        class="mb-2"
        @change="updateData({ isZtSource: $event })"
      >
        中台来源模式
      </ui-checkbox>

      <ui-input
        :model-value="data.waitTimeout"
        type="number"
        label="等待超时时间（秒）"
        placeholder="5"
        class="mb-2 w-full"
        @change="updateData({ waitTimeout: Number($event) || 5 })"
      />

      <ui-checkbox
        :model-value="data.handleErrorDialog"
        class="mb-2"
        @change="updateData({ handleErrorDialog: $event })"
      >
        处理错误弹窗
      </ui-checkbox>
    </ui-card>

    <!-- 参数组列表 -->
    <ui-card class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <p class="font-semibold">优惠参数组</p>
        <ui-button size="small" @click="addParamGroup">
          <v-remixicon name="riAddLine" class="mr-1" />
          添加参数组
        </ui-button>
      </div>

      <div
        v-if="
          data.preferenceSetParamList && data.preferenceSetParamList.length > 0
        "
        class="space-y-4"
      >
        <div
          v-for="(group, groupIndex) in data.preferenceSetParamList"
          :key="groupIndex"
          class="border rounded p-3 bg-gray-50"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium">参数组 {{ groupIndex + 1 }}</span>
            <ui-button
              size="small"
              variant="danger"
              @click="removeParamGroup(groupIndex)"
            >
              <v-remixicon name="riDeleteBin7Line" />
            </ui-button>
          </div>

          <edit-autocomplete class="mb-3 w-full">
            <ui-input
              :model-value="group.paramGroupName"
              :label="data.isZtSource ? '销售品编码' : '销售品名称'"
              :placeholder="
                data.isZtSource ? '如：YD5G01-018-1-1' : '如：主套餐'
              "
              @change="updateParamGroup(groupIndex, { paramGroupName: $event })"
            />
          </edit-autocomplete>

          <!-- 参数项列表 -->
          <div class="ml-2 border-l-2 border-gray-300 pl-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-gray-600">参数列表</span>
              <ui-button size="small" @click="addParam(groupIndex)">
                <v-remixicon name="riAddLine" class="mr-1" />
                添加参数
              </ui-button>
            </div>

            <div
              v-if="
                group.preferenceSetParamList &&
                group.preferenceSetParamList.length > 0
              "
              class="space-y-3"
            >
              <div
                v-for="(param, paramIndex) in group.preferenceSetParamList"
                :key="paramIndex"
                class="border rounded p-2 bg-white"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-medium"
                    >参数 {{ paramIndex + 1 }}</span
                  >
                  <ui-button
                    size="small"
                    variant="danger"
                    @click="removeParam(groupIndex, paramIndex)"
                  >
                    <v-remixicon name="riCloseLine" />
                  </ui-button>
                </div>

                <edit-autocomplete class="mb-2 w-full">
                  <ui-input
                    :model-value="param.parameterName"
                    label="参数名称"
                    placeholder="如：合约期"
                    @change="
                      updateParam(groupIndex, paramIndex, {
                        parameterName: $event,
                      })
                    "
                  />
                </edit-autocomplete>

                <!-- 普通模式显示参数类型 -->
                <ui-select
                  v-if="!data.isZtSource"
                  :model-value="param.parameterType"
                  label="参数类型"
                  class="mb-2 w-full"
                  @change="
                    updateParam(groupIndex, paramIndex, {
                      parameterType: $event,
                    })
                  "
                >
                  <option value="文本输入:input">文本输入</option>
                  <option value="下拉选择:select">下拉选择</option>
                </ui-select>

                <edit-autocomplete class="mb-2 w-full">
                  <ui-input
                    :model-value="param.parameterValue"
                    label="参数值"
                    placeholder="如：24个月 或 1000"
                    @change="
                      updateParam(groupIndex, paramIndex, {
                        parameterValue: $event,
                      })
                    "
                  />
                </edit-autocomplete>

                <!-- 中台模式显示参数编码 -->
                <ui-input
                  v-if="data.isZtSource"
                  :model-value="param.parameterCode"
                  label="参数编码"
                  placeholder="如：termModel"
                  class="mb-2 w-full"
                  @change="
                    updateParam(groupIndex, paramIndex, {
                      parameterCode: $event,
                    })
                  "
                />
              </div>
            </div>

            <p v-else class="text-xs text-gray-500 text-center py-2">
              暂无参数
            </p>
          </div>
        </div>
      </div>

      <p v-else class="text-sm text-gray-500 text-center py-4">
        暂无参数组，点击"添加参数组"按钮开始配置
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

// 参数组管理
function addParamGroup() {
  const preferenceSetParamList = [...(props.data.preferenceSetParamList || [])];
  preferenceSetParamList.push({
    paramGroupName: '',
    preferenceSetParamList: [],
  });
  updateData({ preferenceSetParamList });
}

function removeParamGroup(groupIndex) {
  const preferenceSetParamList = [...(props.data.preferenceSetParamList || [])];
  preferenceSetParamList.splice(groupIndex, 1);
  updateData({ preferenceSetParamList });
}

function updateParamGroup(groupIndex, value) {
  const preferenceSetParamList = [...(props.data.preferenceSetParamList || [])];
  preferenceSetParamList[groupIndex] = {
    ...preferenceSetParamList[groupIndex],
    ...value,
  };
  updateData({ preferenceSetParamList });
}

// 参数项管理
function addParam(groupIndex) {
  const preferenceSetParamList = [...(props.data.preferenceSetParamList || [])];
  const group = { ...preferenceSetParamList[groupIndex] };
  const paramList = [...(group.preferenceSetParamList || [])];

  paramList.push({
    parameterName: '',
    parameterType: '文本输入:input',
    parameterValue: '',
    parameterCode: '',
  });

  group.preferenceSetParamList = paramList;
  preferenceSetParamList[groupIndex] = group;
  updateData({ preferenceSetParamList });
}

function removeParam(groupIndex, paramIndex) {
  const preferenceSetParamList = [...(props.data.preferenceSetParamList || [])];
  const group = { ...preferenceSetParamList[groupIndex] };
  const paramList = [...(group.preferenceSetParamList || [])];

  paramList.splice(paramIndex, 1);

  group.preferenceSetParamList = paramList;
  preferenceSetParamList[groupIndex] = group;
  updateData({ preferenceSetParamList });
}

function updateParam(groupIndex, paramIndex, value) {
  const preferenceSetParamList = [...(props.data.preferenceSetParamList || [])];
  const group = { ...preferenceSetParamList[groupIndex] };
  const paramList = [...(group.preferenceSetParamList || [])];

  paramList[paramIndex] = { ...paramList[paramIndex], ...value };

  group.preferenceSetParamList = paramList;
  preferenceSetParamList[groupIndex] = group;
  updateData({ preferenceSetParamList });
}
</script>
