/**
 * 本地执行服务
 * 负责与本地调试服务 (localhost:8583) 通信
 * 复用 apis/workflows.js 的接口，只是 baseURL 改为本地服务地址
 */

import axios from 'axios';

// 本地服务配置
const LOCAL_SERVICE_URL =
  import.meta.env?.VITE_LOCAL_SERVICE_URL || 'http://localhost:8583/api/';

// 创建专门用于本地服务的 axios 实例
const localRequest = axios.create({
  baseURL: LOCAL_SERVICE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 响应拦截器 - 简化版，不需要认证
localRequest.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理错误但不显示 toast
    const errorMessage =
      error.response?.data?.message || error.message || 'Network Error';

    console.error('[Local Service Error]', {
      status: error.response?.status,
      message: errorMessage,
      url: error.config?.url,
    });

    return Promise.reject(error);
  }
);

// Helper methods - 与 apis/interceptor.js 保持一致
const http = {
  get(url, config) {
    return localRequest.get(url, config);
  },

  post(url, data, config) {
    return localRequest.post(url, data, config);
  },

  put(url, data, config) {
    return localRequest.put(url, data, config);
  },

  delete(url, config) {
    return localRequest.delete(url, config);
  },

  patch(url, data, config) {
    return localRequest.patch(url, data, config);
  },
};

/**
 * 本地执行服务类
 */
class LocalExecutionService {
  constructor() {
    this.baseUrl = LOCAL_SERVICE_URL;
    this._isHealthy = false;
    this._lastHealthCheck = null;
    this._healthCheckInterval = null;
  }

  /**
   * 获取服务健康状态
   */
  get isHealthy() {
    return this._isHealthy;
  }

  /**
   * 获取上次健康检查时间
   */
  get lastHealthCheck() {
    return this._lastHealthCheck;
  }

  /**
   * 健康检查
   * @returns {Promise<{status: string, healthy: boolean, details: object}>}
   */
  async checkHealth() {
    try {
      const response = await http.get('http://localhost:8583/actuator/health', {
        timeout: 3000,
      });

      const { data } = response;
      this._isHealthy = data.status === 'UP';
      this._lastHealthCheck = new Date();

      return {
        status: data.status,
        healthy: data.status === 'UP',
        details: data.components || {},
      };
    } catch (error) {
      this._isHealthy = false;
      this._lastHealthCheck = new Date();

      return {
        status: 'DOWN',
        healthy: false,
        details: {
          error: error.message || '无法连接到本地服务',
        },
      };
    }
  }

  /**
   * 启动定期健康检查
   * @param {number} interval - 检查间隔（毫秒），默认 5000
   * @param {Function} callback - 状态变化回调
   */
  startHealthCheck(interval = 20000, callback = null) {
    this.stopHealthCheck();

    // 立即执行一次
    this.checkHealth().then((result) => {
      if (callback) callback(result);
    });

    // 设置定期检查
    this._healthCheckInterval = setInterval(async () => {
      const result = await this.checkHealth();
      if (callback) callback(result);
    }, interval);
  }

  /**
   * 停止定期健康检查
   */
  stopHealthCheck() {
    if (this._healthCheckInterval) {
      clearInterval(this._healthCheckInterval);
      this._healthCheckInterval = null;
    }
  }

  /**
   * 执行工作流
   * 使用与 apis/workflows.js executeWorkflow 相同的接口
   * POST /workflows/{id}/execute
   *
   * @param {object} workflowData - 工作流数据，必须包含 id
   * @param {object} options - 执行选项
   * @param {object} options.variables - 传递给工作流的变量
   * @param {boolean} options.headless - 是否无头模式
   * @returns {Promise<AxiosResponse>} 返回 ApiResponseExecutionResponse
   * @example
   * response.data = {
   *   success: true,
   *   message: "工作流开始执行",
   *   data: {
   *     executionId: "exec-123",
   *     workflowId: "wf-456",
   *     status: "running",
   *     message: "执行中"
   *   }
   * }
   */
  async executeWorkflow(workflowData, options = {}) {
    // 检查健康状态
    if (!this._isHealthy) {
      const healthResult = await this.checkHealth();
      if (!healthResult.healthy) {
        throw new Error('本地服务不可用，请确保本地调试服务已启动');
      }
    }

    try {
      // 调用 POST /workflows/{id}/execute
      // 请求体格式：{ variables?: object, headless?: boolean }
      const requestBody = {
        variables: options.variables || {},
        headless: options.headless !== undefined ? options.headless : true,
      };

      const response = await http.post(
        `/workflows/${workflowData.id}/execute`,
        requestBody
      );

      return response;
    } catch (error) {
      if (
        error.code === 'ECONNABORTED' ||
        error.message.includes('Network Error')
      ) {
        throw new Error('无法连接到本地服务，请确保本地调试服务已启动');
      }
      throw error;
    }
  }

  /**
   * 获取执行状态
   * 使用与 apis/workflows.js getExecutionStatus 相同的接口
   * @param {string} executionId - 工作流执行ID
   * @returns {Promise<AxiosResponse>}
   */
  async getExecutionStatus(executionId) {
    // 记录请求时间（用于调试）
    const requestTime = Date.now();
    const response = await http.get(`/executions/${executionId}/status`);

    if (this._isHealthy && response.data) {
      // 服务正常响应，保持健康状态
      this._lastHealthCheck = new Date();
    }

    // eslint-disable-next-line no-console
    console.debug(
      `[Local Service] Status check took ${Date.now() - requestTime}ms`
    );
    return response;
  }

  /**
   * 停止执行
   * 使用与 apis/workflows.js stopWorkflow 相同的接口
   * @param {string} workflowId - 工作流ID
   * @returns {Promise<AxiosResponse>}
   */
  async stopExecution(executionId) {
    // 调用 POST /workflows/{id}/stop
    const response = await http.post(`/executions/${executionId}/stop`);

    // eslint-disable-next-line no-console
    console.debug(`[Local Service] Stopped workflow ${executionId}`);
    return response;
  }

  /**
   * 获取执行日志
   * 使用与 apis/workflows.js getExecutionLogs 相同的接口
   * @param {string} executionId - 工作流ID
   * @param {Object} params - 查询参数
   * @returns {Promise<AxiosResponse>}
   */
  async getExecutionLogs(executionId, params = {}) {
    // 调用 GET /workflows/{id}/logs
    const response = await http.get(`/workflows/${executionId}/logs`, {
      params,
    });

    // eslint-disable-next-line no-console
    console.debug(`[Local Service] Fetched logs for workflow ${executionId}`);
    return response;
  }

  /**
   * 获取执行日志（SSE 流式）
   * @param {string} workflowId - 工作流ID
   * @param {Function} onMessage - 消息回调
   * @param {Function} onError - 错误回调
   * @returns {EventSource}
   */
  subscribeToExecutionLogs(workflowId, onMessage, onError) {
    // 使用 GET /workflows/{id}/execute-stream
    const url = `${this.baseUrl}/workflows/${workflowId}/execute-stream`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (e) {
        if (onMessage) onMessage({ raw: event.data });
      }
    };

    eventSource.onerror = (error) => {
      if (onError) onError(error);
      eventSource.close();
    };

    return eventSource;
  }
}

// 导出单例实例
export const localExecutionService = new LocalExecutionService();

// 导出类以便测试
export default LocalExecutionService;
