export default {
  // 独立销售品订购块
  'independent-prod-order': {
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
      isZtSource: false,
      skipCurrentProcess: false,
      skipValidation: true,
      waitTimeout: 5,
      productInfo: [
        {
          offerCode: '',
          offerName: '',
          check: [],
          unCheck: [],
        },
      ],
    },
  },
};
