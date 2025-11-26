/*
 * @Description:
 * @Author: Jin Tang
 * @Date: 2025-11-25 17:58:34
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-11-26 14:44:48
 */
export default function () {
  return {
    // CRM客户查询块
    'crm-get-customer': {
      name: 'CRM - 查询客户',
      description: '从企业CRM系统查询客户信息',
      icon: '', // Remix Icon 图标名
      component: 'BlockBasic', // 使用基础块组件
      editComponent: 'EditCRMGetCustomer', // 编辑组件（稍后创建）
      category: 'integration', // 分类：integration(集成)
      inputs: 1, // 输入连接点数量
      outputs: 1, // 输出连接点数量
      maxConnection: 1, // 最大连接数
      allowedInputs: true, // 允许输入
      refDataKeys: ['queryType', 'queryParams'], // 可引用的数据键
      data: {
        disableBlock: false, // 是否禁用
        description: '', // 块描述
        queryType: 'by-id', // 查询类型: by-access-num
        queryParams: '', // 查询参数
        dataColumn: 'crm-customer', // 保存到的表格列
        assignVariable: true, // 是否分配给变量
        variableName: 'customerInfo', // 变量名
      },
    },
  };
}
