/*
 * @Description:
 * @Author: Jin Tang
 * @Date: 2025-12-10 17:59:25
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-12-20 17:44:07
 */
export default {
  // 登录处理块
  'telecom-login': {
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
      loginType: 'password', // password | cookie
      // 账号密码登录参数
      username: '',
      password: '',
      // 岗位名称
      position: '订单支撑岗',
      // 变量赋值
      assignVariable: true,
      variableName: 'loginResult',
    },
  },
};
