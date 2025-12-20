/*
 * @Description: 订单提交块定义
 * @Author: Jin Tang
 * @Date: 2025-12-19
 */
export default {
  'telecom-submit-order': {
    name: '订单提交',
    description: '电信CRM订单提交处理，支持弹窗处理、错误处理、订单作废等',
    icon: 'riSendPlaneLine',
    component: 'BlockBasic',
    editComponent: 'EditSubmitOrder',
    category: 'integration',
    inputs: 1,
    outputs: 1,
    maxConnection: 1,
    allowedInputs: true,
    autocomplete: ['variableName'],
    data: {
      disableBlock: false,
      isPay: '0', // 是否收费订单："0"=不收费, "1"=收费
      confirmSubmit: false, // 是否执行确认提交操作
      invalid: false, // 是否主动作废订单
      completed: false, // 是否查询工单竣工状态
      skipPhoneNumberQuantityReview: false, // 是否自动跳过电话号码数量审核
      waitTime: 60, // 查询工单竣工等待时间（秒）
      feedbackNo: '申请单编码:reqNo', // 返回编码类型
      waitTimeAfterSubmit: 0, // 点击提交后额外等待时间（秒）
      invalidKey: [], // 触发作废的关键字列表
      userName: '', // 限流模式下的用户名
      isMinimalismOrderParam: '', // 是否极简订购："1"=是, "0"=否, ""=自动判断
      variableMap: [], // 中间结果变量映射 [{name: '', value: ''}]
      outboundAgents: false, // 是否外呼工单
      outboundWorkNo: '', // 外呼工单号
      ifMandatoryReceipt: '0', // 是否强制打印回执："0"=否, "1"=是
    },
  },
};
