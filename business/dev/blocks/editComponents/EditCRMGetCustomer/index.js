/*
 * @Description:
 * @Author: Jin Tang
 * @Date: 2025-12-10 17:53:44
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-12-10 17:56:44
 */

export default {
  // CRM客户查询块
  'crm-get-customer': {
    name: 'CRM - 查询客户',
    description: '从企业CRM系统查询客户信息',
    icon: 'riAccountCircleLine',
    component: 'BlockBasic',
    editComponent: 'EditCRMGetCustomer',
    category: 'integration',
    inputs: 1,
    outputs: 1,
    maxConnection: 1,
    allowedInputs: true,
    autocomplete: ['variableName'],
    data: {
      disableBlock: false,
      description: '',
      queryType: 'accessNumber',
      queryValue: '',
      assignVariable: true,
      variableName: '',
    },
  },
};
