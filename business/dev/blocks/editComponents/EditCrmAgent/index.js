/*
 * @Description:
 * @Author: Jin Tang
 * @Date: 2025-12-16 17:37:44
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-12-16 17:46:22
 */
export default {
  // TODO crm经办人
  'crm-agent': {
    name: 'CRM - 经办人',
    description: '经办人信息',
    icon: '',
    component: 'BlockBasic',
    editComponent: 'EditCrmAgent',
    category: 'integration',
    inputs: 1,
    outputs: 1,
    maxConnection: 1,
    allowedInputs: true,
    autocomplete: ['variableName'],
    data: {
      disableBlock: false,
      description: '',
      // TODO crm经办人参数
      linkMan: false,
      linkPhone: false,
      handlerFindType: false,
      handlerFindValue: false,
      handlerType: false,
      carryManFindType: false,
      carryManFindValue: false,
      isHandlerCarryMan: false,
      carryManFindValue1: false,
      carryManFindType1: false,
      carryManFindValue2: false,
      carryManFindType2: false,
      orderRemark: false,
      bookTime: false,
      convertToZeroSignalControl: true,
      // ======================
      assignVariable: true,
      variableName: '',
    },
  },
};
