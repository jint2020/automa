export default function () {
  return {
    async login({ data, id }) {
      try {
        const {
          loginMethod,
          username,
          password,
          position,
          mockResponse,
          mockToken,
          mockUserInfo,
          assignVariable,
          variableName,
        } = data;

        // 1. 构建登录请求参数
        const loginParams = {
          loginMethod,
          position,
        };

        // 根据登录方式构建参数
        if (loginMethod === 'account') {
          // 账号密码登录
          loginParams.username = username;
          loginParams.password = password;
        } else if (loginMethod === 'cookie') {
          // Cookie 登录（JSESSIONID 会从浏览器自动获取）
          loginParams.method = 'cookie';
        }

        // 2. 构建返回结果
        let loginResult;

        if (mockResponse) {
          // 使用模拟数据
          let userInfo = {};
          if (mockUserInfo) {
            try {
              userInfo = JSON.parse(mockUserInfo);
            } catch (e) {
              console.warn('[Login] 模拟用户信息解析失败:', e.message);
            }
          }

          loginResult = {
            success: true,
            token: mockToken || 'mock_token',
            userInfo,
            loginParams, // 包含原始登录参数供调试
            timestamp: new Date().toISOString(),
          };
        } else {
          // 实际场景：这里应该调用真实的登录 API
          // const response = await http.post('/auth/login', loginParams);
          // loginResult = response.data;

          // 当前返回参数结构，供下一个节点使用
          loginResult = {
            success: false,
            message: '请启用模拟响应或在 Handler 中实现真实登录逻辑',
            loginParams,
            timestamp: new Date().toISOString(),
          };
        }

        // 3. 保存到变量
        if (assignVariable && variableName) {
          this.setVariable(variableName, loginResult);
        }

        // 4. 返回结果给下一个节点
        return {
          data: loginResult,
          nextBlockId: this.getBlockConnections(id),
        };
      } catch (error) {
        throw new Error(`登录处理失败: ${error.message}`);
      }
    },
  };
}
