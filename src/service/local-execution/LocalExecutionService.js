/**
 * 本地执行服务
 * 负责与本地调试服务 (localhost:8583) 通信
 */

// 本地服务配置
const LOCAL_SERVICE_URL =
  import.meta.env?.VITE_LOCAL_SERVICE_URL || 'http://localhost:8583';
const HEALTH_CHECK_ENDPOINT = '/actuator/health';
const EXECUTE_ENDPOINT = '/workflow/execute';
const EXECUTION_STATUS_ENDPOINT = '/workflow/execution';

// 请求超时时间（毫秒）
const REQUEST_TIMEOUT = 10000;
const HEALTH_CHECK_TIMEOUT = 3000;

/**
 * 带超时的 fetch 请求
 */
async function fetchWithTimeout(url, options = {}, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('请求超时');
    }
    throw error;
  }
}

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
      const response = await fetchWithTimeout(
        `${this.baseUrl}${HEALTH_CHECK_ENDPOINT}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        },
        HEALTH_CHECK_TIMEOUT
      );

      if (!response.ok) {
        this._isHealthy = false;
        this._lastHealthCheck = new Date();
        return {
          status: 'DOWN',
          healthy: false,
          details: { error: `HTTP ${response.status}` },
        };
      }

      const data = await response.json();
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
  startHealthCheck(interval = 5000, callback = null) {
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
   * @param {object} workflowData - 工作流数据
   * @param {object} options - 执行选项
   * @returns {Promise<{executionId: string, status: string, message: string}>}
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
      const response = await fetchWithTimeout(
        `${this.baseUrl}${EXECUTE_ENDPOINT}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            workflowId: workflowData.id,
            workflowData: {
              id: workflowData.id,
              name: workflowData.name,
              drawflow: workflowData.drawflow,
              globalData: workflowData.globalData,
              table: workflowData.table || [],
              dataColumns: workflowData.dataColumns || [],
              settings: workflowData.settings || {},
            },
            options: {
              debug: true,
              ...options,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `执行失败: HTTP ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('无法连接到本地服务，请确保本地调试服务已启动');
      }
      throw error;
    }
  }

  /**
   * 获取执行状态
   * @param {string} executionId - 执行ID
   * @returns {Promise<object>}
   */
  async getExecutionStatus(executionId) {
    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}${EXECUTION_STATUS_ENDPOINT}/${executionId}/status`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`获取状态失败: HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * 停止执行
   * @param {string} executionId - 执行ID
   * @returns {Promise<object>}
   */
  async stopExecution(executionId) {
    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}${EXECUTION_STATUS_ENDPOINT}/${executionId}/stop`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`停止执行失败: HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取执行日志（SSE 流式）
   * @param {string} executionId - 执行ID
   * @param {Function} onMessage - 消息回调
   * @param {Function} onError - 错误回调
   * @returns {EventSource}
   */
  subscribeToExecutionLogs(executionId, onMessage, onError) {
    const url = `${this.baseUrl}${EXECUTION_STATUS_ENDPOINT}/${executionId}/logs`;
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
