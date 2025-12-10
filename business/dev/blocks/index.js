/*
 * @Description:
 * @Author: Jin Tang
 * @Date: 2025-11-25 17:58:34
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-12-09 15:02:44
 */
export default function () {
  return {
    // 登录处理块
    login: {
      name: '登录处理',
      description: '处理登录参数和登录返回结果',
      icon: 'riLoginBoxLine',
      component: 'BlockBasic',
      editComponent: 'EditLogin',
      category: 'integration',
      inputs: 1,
      outputs: 1,
      maxConnection: 1,
      allowedInputs: true,
      autocomplete: ['variableName'],
      data: {
        disableBlock: false,
        description: '',
        // 登录方式
        loginMethod: 'account', // account | cookie
        // 账号密码登录参数
        username: '',
        password: '',
        // 岗位名称
        position: '订单支撑岗',
        // 模拟返回数据（用于测试）
        mockResponse: true,
        mockToken: 'mock_token_123456',
        mockUserInfo:
          '{"userId": "001", "userName": "测试用户", "role": "admin"}',
        // 变量赋值
        assignVariable: true,
        variableName: 'loginResult',
      },
    },

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
}
