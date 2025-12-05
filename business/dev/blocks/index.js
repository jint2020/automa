/*
 * @Description:
 * @Author: Jin Tang
 * @Date: 2025-11-25 17:58:34
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-12-05 11:03:36
 */
export default function () {
  return {
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
      data: {
        disableBlock: false,
        description: '',
        queryType: 'accessNumber',
        queryParams: 'accessNumber:orient',
        dataColumn: 'customerInfo',
        assignVariable: true,
        variableName: 'customerData',
      },
    },
  };
}
