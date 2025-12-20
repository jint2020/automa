/*
 * @Description: 
 * @Author: Jin Tang
 * @Date: 2025-12-10 17:59:20
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-12-20 17:50:00
 */
export default {
  // 独立销售品订购块
  'telecom-independent-product-order': {
    name: '独立销售品订购',
    description: '在广东电信CRM系统中自动完成独立销售品的订购流程',
    icon: 'riShoppingCartLine',
    component: 'BlockBasic',
    editComponent: 'EditIndependentProdOrder',
    category: 'integration',
    inputs: 1,
    outputs: 1,
    maxConnection: 1,
    allowedInputs: true,
    data: {
      disableBlock: false,
      description: '',
      // isZtSource: false,
      // skipCurrentProcess: false,
      // skipValidation: true,
      // 没有订购标识跳过当前流程
      skipValidation: false,
      productInfo: [
        {
          offerCode: '',
          check: [],
          unCheck: [],
        },
      ],
    },
  },
};
