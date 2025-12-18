/*
 * @Description: 办理套餐块定义
 * @Author: Jin Tang
 * @Date: 2025-12-17
 */

export default {
  // 办理套餐块
  'telecom-package-subscription': {
    name: '办理套餐',
    description: '电信CRM销售品配置，支持订购、加入、其它等操作',
    icon: 'riCheckDoubleFill',
    component: 'BlockBasic',
    editComponent: 'EditPackageSubscription',
    category: 'integration',
    inputs: 1,
    outputs: 1,
    maxConnection: 1,
    allowedInputs: true,
    data: {
      disableBlock: false,
      description: '',
      isZtSource: false,
      mutualExclusionCheck: false,
      skipValidation: false,
      productList: [],
    },
  },
};
