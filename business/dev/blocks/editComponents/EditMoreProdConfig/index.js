/*
 * @Description:
 * @Author: Jin Tang
 * @Date: 2025-12-17 14:54:41
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-12-18 16:02:12
 */
export default {
  // 更多产品配置处理块
  'more-prod-conf': {
    name: '更多产品配置配置',
    description: '处理更多产品配置参数和返回结果',
    icon: 'riMoreFill',
    component: 'BlockBasic',
    editComponent: 'EditMoreProdConfig',
    category: 'integration',
    inputs: 1,
    outputs: 1,
    maxConnection: 1,
    allowedInputs: true,
    autocomplete: ['variableName'],
    data: {
      disableBlock: false,
      moreSalesProductConfig: [
        {
          moreSalesProductCode: '', // 更多产品编码
          clearOriginalSales: false, // 是否清除原销售品
        },
      ],
    },
  },
};
