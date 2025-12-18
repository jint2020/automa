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
      productList: [
        {
          offerCode: '', // 销售品编码,input输入，支持{{}}变量
          productType: '基础有线宽带:productType', // 产品类型, select交互方式
          productName: '天翼宽带拨号(原ADSL拨号):productName', // 产品名称，select交互方式
          action: '订购:productAction', // 具体动作，select交互方式
          addAccessType: '销售品内产品-天翼宽带拨号(原ADSL拨号):productAddType', // 加入类型，select交互方式
          relatedParam: '', // 关联参数，input输入，支持{{}}变量
        },
      ],
    },
  },
};
