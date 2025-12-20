/*
 * @Description:
 * @Author: Jin Tang
 * @Date: 2025-12-10 17:53:44
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-12-20 17:38:20
 */

export default {
  // CRM客户查询块
  'telecom-query-customer': {
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
    autocomplete: ['variableName', 'searchValue'],
    data: {
      disableBlock: false,
      description: '',
      searchType: 'accessNumber',
      searchValue: '',
      assignVariable: true,
      variableName: '',
    },
  },
};
