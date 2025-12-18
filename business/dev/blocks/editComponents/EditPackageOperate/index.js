/*
 * @Description: 套餐操作块定义
 * @Author: Jin Tang
 * @Date: 2025-12-17
 */

export default {
  // 套餐操作块
  'telecom-package-operate': {
    name: '套餐操作',
    description: '电信CRM套餐操作，支持退订、变更、预存续约等',
    icon: 'riSettings3Line',
    component: 'BlockBasic',
    editComponent: 'EditPackageOperate',
    category: 'integration',
    inputs: 1,
    outputs: 1,
    maxConnection: 1,
    allowedInputs: true,
    data: {
      disableBlock: false,
      description: '',
      packageName: '',
      packageCode: '',
      objectList: '',
      packageType: '',
      operate: '退订:td',
      filterExpired: true,
      handleSkipValidation: true,
      handleOfflineProduct: true,
    },
  },
};
