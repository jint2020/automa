export default {
  'prod-info': {
    name: '产品信息配置',
    description: '处理产品信息相关参数和返回结果',
    icon: 'riProductHuntLine',
    component: 'BlockBasic',
    editComponent: 'EditProdInfo',
    category: 'integration',
    inputs: 1,
    outputs: 1,
    maxConnection: 1,
    allowedInputs: true,
    autocomplete: ['variableName'],
    data: {
      disableBlock: false,
      baseOrderSalesName: '', // 当前业务名称
      productInfo: [
        {
          type: '', // ui-select：选项:check, uncheck, infoItem
          key: '', // 前端创建时使用
          value: '', // 产品信息值，支持{{}}变量
          order: 0, // 顺序
        },
      ],
    },
  },
};
