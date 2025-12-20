/*
 * @Description:
 * @Author: Jin Tang
 * @Date: 2025-12-16 17:37:44
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-12-17 11:53:56
 */
export default {
  // TODO crm经办人
  'telecom-agent-info': {
    name: 'CRM - 经办人',
    description: '经办人信息',
    icon: 'riContactsLine',
    component: 'BlockBasic',
    editComponent: 'EditCrmAgent',
    category: 'integration',
    inputs: 1,
    outputs: 1,
    maxConnection: 1,
    allowedInputs: true,
    // autocomplete: ['variableName'],
    data: {
      disableBlock: false,
      description: '',
      // TODO crm经办人参数 (undefined 表示未启用字段)
      handlerNoassociationParameter: undefined,
      handlerYxdassociationParameter: undefined,
      carryManCode: undefined,
      firstCoSellerCode: undefined,
      secondCoSellerCode: undefined,
      custName: undefined,
      custPhone: undefined,
      isSelfHandlerassociationParameter: undefined,
      convertedToZeroSignalControlUser: undefined,
      bookTimeassociationParameter: undefined,
      bookRefuseReasonassociationParameter: undefined,
      orderRemark: undefined,
      // ======================
      // assignVariable: true,
      // variableName: '',
    },
  },
};
