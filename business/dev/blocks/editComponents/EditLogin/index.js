export default {
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
};
