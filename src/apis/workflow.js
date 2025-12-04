/**
 * Workflow Management API
 * 工作流的创建、查询、更新、删除和执行
 */

import { http } from './interceptor';

/**
 * Get all workflows
 * 获取系统中所有工作流的摘要列表
 * @returns {Promise}
 */
export function getAllWorkflows() {
  return http.get('/workflows');
}

/**
 * Get workflow by ID
 * 根据工作流 ID 获取完整的工作流配置和定义
 * @param {string} id
 * @returns {Promise}
 */
export function getWorkflow(id) {
  return http.get(`/workflows/${id}`);
}

/**
 * Create a new workflow
 * 创建一个新的工作流配置
 * @param {Object} data
 * @returns {Promise}
 */
export function createWorkflow(data) {
  return http.post('/workflows', data);
}

/**
 * Update workflow
 * 更新指定工作流的配置信息
 * @param {string} id
 * @param {Object} data
 * @returns {Promise}
 */
export function updateWorkflow(id, data) {
  return http.put(`/workflows/${id}`, data);
}

/**
 * Delete workflow
 * 逻辑删除指定的工作流
 * @param {string} id
 * @returns {Promise}
 */
export function deleteWorkflow(id) {
  return http.delete(`/workflows/${id}`);
}

/**
 * Execute workflow
 * 异步执行指定的工作流，返回执行ID用于后续查询状态
 * @param {string} id
 * @param {Object} [data]
 * @returns {Promise}
 */
export function executeWorkflow(id, data) {
  return http.post(`/workflows/${id}/execute`, data);
}

/**
 * Stop workflow execution
 * 停止正在运行的工作流
 * @param {string} id
 * @returns {Promise}
 */
export function stopWorkflow(id) {
  return http.post(`/workflows/${id}/stop`);
}

/**
 * Get workflow execution status
 * 获取工作流的执行状态和统计信息
 * @param {string} id
 * @returns {Promise}
 */
export function getExecutionStatus(id) {
  return http.get(`/workflows/${id}/status`);
}

/**
 * Get workflow execution logs
 * 分页获取工作流的执行日志
 * @param {string} id
 * @param {Object} [params]
 * @param {number} [params.offset]
 * @param {number} [params.limit]
 * @returns {Promise}
 */
export function getExecutionLogs(id, params) {
  return http.get(`/workflows/${id}/logs`, { params });
}

/**
 * Execute workflow with SSE stream (GET)
 * 通过GET方式流式执行工作流，用于简单测试场景
 * Note: This returns SSE stream, handle with EventSource
 * @param {string} id
 * @returns {string}
 */
export function getStreamExecuteUrl(id) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/';
  return `${baseUrl}workflows/${id}/execute-stream`;
}

/**
 * Execute workflow with SSE stream (POST)
 * 通过SSE流式执行工作流，客户端可以实时接收执行事件
 * Note: This returns SSE stream, requires special handling
 * @param {string} id
 * @param {Object} [data]
 * @returns {Promise}
 */
export function executeWorkflowStream(id, data) {
  return http.post(`/workflows/${id}/execute-stream`, data, {
    headers: {
      Accept: 'text/event-stream',
    },
    responseType: 'stream',
  });
}

export default {
  getAllWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  executeWorkflow,
  stopWorkflow,
  getExecutionStatus,
  getExecutionLogs,
  getStreamExecuteUrl,
  executeWorkflowStream,
};
