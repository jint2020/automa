/*
 * @Description: 优惠参数设置块定义
 * @Author: Jin Tang
 * @Date: 2025-12-17
 */

export default {
  // 优惠参数设置块
  'telecom-preference-set-param': {
    name: '优惠参数设置',
    description: '电信CRM优惠参数设置，支持文本输入和下拉选择',
    icon: 'riFileSettingsLine',
    component: 'BlockBasic',
    editComponent: 'EditPreferenceSetParam',
    category: 'integration',
    inputs: 1,
    outputs: 1,
    maxConnection: 1,
    allowedInputs: true,
    data: {
      disableBlock: false,
      description: '',
      // isZtSource: false,
      // waitTimeout: 5,
      // handleErrorDialog: true,
      preferenceSetParamList: [],
    },
  },
};
