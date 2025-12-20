/**
 * 执行状态 Store
 * 管理工作流执行状态、本地服务健康状态、执行日志等
 */
import { defineStore } from 'pinia';
import { localExecutionService } from '@/service/local-execution/LocalExecutionService';

// 执行状态枚举
export const ExecutionStatus = {
  IDLE: 'idle',
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  STOPPED: 'stopped',
};

// 本地服务状态枚举
export const ServiceStatus = {
  UNKNOWN: 'unknown',
  HEALTHY: 'healthy',
  UNHEALTHY: 'unhealthy',
};

export const useExecutionStore = defineStore('execution', {
  state: () => ({
    // 本地服务状态
    localServiceStatus: ServiceStatus.UNKNOWN,
    lastHealthCheck: null,
    healthCheckError: null,

    // 当前执行状态
    currentExecution: null,
    executionStatus: ExecutionStatus.IDLE,

    // 执行日志
    logs: [],
    maxLogs: 500,

    // 执行历史
    executionHistory: [],
    maxHistory: 50,

    // 状态轮询
    statusPollingInterval: null,
    logsEventSource: null,
  }),

  getters: {
    /**
     * 是否可以执行
     */
    canExecute: (state) => {
      return (
        state.localServiceStatus === ServiceStatus.HEALTHY &&
        state.executionStatus !== ExecutionStatus.RUNNING &&
        state.executionStatus !== ExecutionStatus.PENDING
      );
    },

    /**
     * 是否正在执行
     */
    isExecuting: (state) => {
      return (
        state.executionStatus === ExecutionStatus.RUNNING ||
        state.executionStatus === ExecutionStatus.PENDING
      );
    },

    /**
     * 本地服务是否健康
     */
    isServiceHealthy: (state) => {
      return state.localServiceStatus === ServiceStatus.HEALTHY;
    },

    /**
     * 获取最近的执行记录
     */
    recentExecutions: (state) => {
      return state.executionHistory.slice(0, 10);
    },
  },

  actions: {
    /**
     * 检查本地服务健康状态
     */
    async checkHealth() {
      try {
        const result = await localExecutionService.checkHealth();
        this.localServiceStatus = result.healthy
          ? ServiceStatus.HEALTHY
          : ServiceStatus.UNHEALTHY;
        this.lastHealthCheck = new Date();
        this.healthCheckError = result.healthy ? null : result.details.error;
        return result;
      } catch (error) {
        this.localServiceStatus = ServiceStatus.UNHEALTHY;
        this.lastHealthCheck = new Date();
        this.healthCheckError = error.message;
        return { healthy: false, error: error.message };
      }
    },

    /**
     * 启动定期健康检查
     */
    startHealthCheck(interval = 5000) {
      localExecutionService.startHealthCheck(interval, (result) => {
        this.localServiceStatus = result.healthy
          ? ServiceStatus.HEALTHY
          : ServiceStatus.UNHEALTHY;
        this.lastHealthCheck = new Date();
        this.healthCheckError = result.healthy ? null : result.details?.error;
      });
    },

    /**
     * 停止定期健康检查
     */
    stopHealthCheck() {
      localExecutionService.stopHealthCheck();
    },

    /**
     * 执行工作流
     * @param {object} workflowData - 工作流数据
     * @param {object} options - 执行选项
     */
    async executeWorkflow(workflowData, options = {}) {
      // 检查是否可以执行
      if (!this.canExecute) {
        if (this.isExecuting) {
          throw new Error('已有工作流正在执行中');
        }
        if (!this.isServiceHealthy) {
          throw new Error('本地服务不可用，请确保本地调试服务已启动');
        }
      }

      this.executionStatus = ExecutionStatus.PENDING;
      this.logs = [];
      this.addLog('info', `开始执行工作流: ${workflowData.name}`);

      try {
        const response = await localExecutionService.executeWorkflow(
          workflowData,
          options
        );

        // axios 响应数据在 response.data 中
        // API 响应格式：{ success: boolean, message: string, data: ExecutionResponse }
        if (!response.data.success) {
          throw new Error(response.data.message || '执行失败');
        }

        const executionData = response.data.data;

        this.currentExecution = {
          executionId: executionData.executionId,
          workflowId: executionData.workflowId || workflowData.id,
          workflowName: workflowData.name,
          startTime: new Date(),
          status: executionData.status,
        };

        this.executionStatus = ExecutionStatus.RUNNING;
        this.addLog('info', `执行ID: ${executionData.executionId}`);
        if (executionData.message) {
          this.addLog('info', executionData.message);
        }

        // 开始轮询状态（使用 workflowId）
        this.startStatusPolling(executionData.executionId);

        // 订阅执行日志（使用 workflowId）
        this.subscribeToLogs(workflowData.id);

        return executionData;
      } catch (error) {
        this.executionStatus = ExecutionStatus.FAILED;
        this.addLog('error', `执行失败: ${error.message}`);

        // 添加到历史记录
        this.addToHistory({
          workflowId: workflowData.id,
          workflowName: workflowData.name,
          status: ExecutionStatus.FAILED,
          error: error.message,
          startTime: new Date(),
          endTime: new Date(),
        });

        throw error;
      }
    },

    /**
     * 停止执行
     */
    async stopExecution() {
      if (!this.currentExecution) {
        throw new Error('没有正在执行的工作流');
      }

      this.addLog('info', '正在停止执行...');

      try {
        // 使用 workflowId 停止执行
        const response = await localExecutionService.stopExecution(
          this.currentExecution.executionId
        );

        this.executionStatus = ExecutionStatus.STOPPED;
        this.addLog('info', '执行已停止');

        // 停止状态轮询和日志订阅
        this.stopStatusPolling();
        this.unsubscribeFromLogs();

        // 添加到历史记录
        this.addToHistory({
          ...this.currentExecution,
          status: ExecutionStatus.STOPPED,
          endTime: new Date(),
        });

        this.currentExecution = null;

        return response.data;
      } catch (error) {
        this.addLog('error', `停止执行失败: ${error.message}`);
        throw error;
      }
    },

    /**
     * 开始轮询执行状态
     * @param {string} executionId - 工作流ID
     * @param {number} interval - 轮询间隔（毫秒）
     */
    startStatusPolling(executionId, interval = 2000) {
      this.stopStatusPolling();

      this.statusPollingInterval = setInterval(async () => {
        try {
          const response = await localExecutionService.getExecutionStatus(
            executionId
          );

          // axios 响应数据在 response.data 中
          const statusData = response.data;

          // 更新当前执行状态
          if (this.currentExecution) {
            this.currentExecution.status = statusData.status;
            this.currentExecution.currentBlock = statusData.currentBlock;
            this.currentExecution.progress = statusData.progress;
          }

          // 检查是否完成
          if (
            statusData.status === 'completed' ||
            statusData.status === 'failed' ||
            statusData.status === 'stopped'
          ) {
            this.onExecutionComplete(statusData);
          }
        } catch (error) {
          // status 接口返回错误，直接停止执行
          console.error('获取执行状态失败，停止执行:', error);
          this.addLog('error', `状态查询失败: ${error.message}`);

          // 尝试调用 stop API
          try {
            await localExecutionService.stopExecution(executionId);
          } catch (stopError) {
            console.error('调用停止接口失败:', stopError);
          }

          // 标记为失败并完成执行
          this.onExecutionComplete({
            status: 'failed',
            error: error.message || '状态查询失败',
          });
        }
      }, interval);
    },

    /**
     * 停止状态轮询
     */
    stopStatusPolling() {
      if (this.statusPollingInterval) {
        clearInterval(this.statusPollingInterval);
        this.statusPollingInterval = null;
      }
    },

    /**
     * 订阅执行日志（SSE）
     * @param {string} workflowId - 工作流ID
     */
    subscribeToLogs(workflowId) {
      this.unsubscribeFromLogs();

      this.logsEventSource = localExecutionService.subscribeToExecutionLogs(
        workflowId,
        (data) => {
          if (data.level && data.message) {
            this.addLog(data.level, data.message, data.timestamp);
          } else if (data.raw) {
            this.addLog('info', data.raw);
          }
        },
        (error) => {
          console.error('日志订阅错误:', error);
        }
      );
    },

    /**
     * 取消订阅日志
     */
    unsubscribeFromLogs() {
      if (this.logsEventSource) {
        this.logsEventSource.close();
        this.logsEventSource = null;
      }
    },

    /**
     * 执行完成处理
     */
    onExecutionComplete(status) {
      this.stopStatusPolling();
      this.unsubscribeFromLogs();

      const finalStatus =
        status.status === 'completed'
          ? ExecutionStatus.COMPLETED
          : status.status === 'failed'
          ? ExecutionStatus.FAILED
          : ExecutionStatus.STOPPED;

      this.executionStatus = finalStatus;
      this.addLog(
        finalStatus === ExecutionStatus.COMPLETED ? 'info' : 'error',
        `执行${
          finalStatus === ExecutionStatus.COMPLETED
            ? '完成'
            : finalStatus === ExecutionStatus.FAILED
            ? '失败'
            : '已停止'
        }`
      );

      // 添加到历史记录
      if (this.currentExecution) {
        this.addToHistory({
          ...this.currentExecution,
          status: finalStatus,
          endTime: new Date(),
          error: status.error,
        });
      }

      this.currentExecution = null;
    },

    /**
     * 添加日志
     */
    addLog(level, message, timestamp = null) {
      const log = {
        id: Date.now() + Math.random(),
        level,
        message,
        timestamp: timestamp || new Date().toISOString(),
      };

      this.logs.push(log);

      // 限制日志数量
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }
    },

    /**
     * 清空日志
     */
    clearLogs() {
      this.logs = [];
    },

    /**
     * 添加到历史记录
     */
    addToHistory(execution) {
      this.executionHistory.unshift(execution);

      // 限制历史记录数量
      if (this.executionHistory.length > this.maxHistory) {
        this.executionHistory = this.executionHistory.slice(0, this.maxHistory);
      }
    },

    /**
     * 清空历史记录
     */
    clearHistory() {
      this.executionHistory = [];
    },

    /**
     * 重置状态
     */
    reset() {
      this.stopStatusPolling();
      this.unsubscribeFromLogs();
      this.currentExecution = null;
      this.executionStatus = ExecutionStatus.IDLE;
    },
  },
});
