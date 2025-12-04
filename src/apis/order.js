/**
 * Order Management API
 * 工作流订单管理 - 提交和管理工作流执行订单
 */

import { http } from './interceptor';

/**
 * Submit order via workflow endpoint
 * 通过工作流端点提交订单，异步执行工作流并返回订单信息
 * @param {string} workflowEndpoint
 * @param {Object} data
 * @returns {Promise}
 */
export function submitOrderByEndpoint(workflowEndpoint, data) {
  return http.post(`/order/${workflowEndpoint}`, data);
}

/**
 * Get order status
 * 根据订单 ID 查询工作流执行的实时状态、进度和当前步骤
 * @param {string} orderId
 * @returns {Promise}
 */
export function getOrderStatus(orderId) {
  return http.get(`/order/${orderId}/status`);
}

/**
 * Get order result
 * 获取已完成订单的执行结果数据和日志信息
 * @param {string} orderId
 * @returns {Promise}
 */
export function getOrderResult(orderId) {
  return http.get(`/order/${orderId}/result`);
}

/**
 * Submit workflow order
 * 提交一个工作流以进行异步执行
 * @param {Object} data
 * @returns {Promise}
 */
export function submitOrder(data) {
  return http.post('/orders/submit', data);
}

/**
 * Query orders
 * 带过滤条件查询订单
 * @param {Object} data
 * @returns {Promise}
 */
export function queryOrders(data) {
  return http.post('/orders/query', data);
}

/**
 * Get order details
 * 根据订单代码检索订单信息
 * @param {string} orderCode
 * @returns {Promise}
 */
export function getOrder(orderCode) {
  return http.get(`/orders/${orderCode}`);
}

/**
 * Cancel order
 * 取消待处理订单
 * @param {string} orderCode
 * @returns {Promise}
 */
export function cancelOrder(orderCode) {
  return http.delete(`/orders/${orderCode}`);
}

/**
 * Stop running order
 * 停止当前正在处理的订单
 * @param {string} orderCode
 * @returns {Promise}
 */
export function stopOrder(orderCode) {
  return http.post(`/orders/${orderCode}/stop`);
}

/**
 * Retry failed order
 * 重试失败的订单
 * @param {string} orderCode
 * @returns {Promise}
 */
export function retryOrder(orderCode) {
  return http.post(`/orders/${orderCode}/retry`);
}

/**
 * Update order priority
 * 更改待处理订单的优先级
 * @param {string} orderCode
 * @param {number} priority
 * @returns {Promise}
 */
export function updateOrderPriority(orderCode, priority) {
  return http.put(`/orders/${orderCode}/priority`, null, {
    params: { priority },
  });
}

/**
 * Get queue position
 * 获取订单在队列中的当前位置
 * @param {string} orderCode
 * @returns {Promise}
 */
export function getQueuePosition(orderCode) {
  return http.get(`/orders/${orderCode}/position`);
}

/**
 * Get scheduler stats
 * 获取当前调度器统计信息
 * @returns {Promise}
 */
export function getSchedulerStats() {
  return http.get('/orders/stats');
}

export default {
  submitOrderByEndpoint,
  getOrderStatus,
  getOrderResult,
  submitOrder,
  queryOrders,
  getOrder,
  cancelOrder,
  stopOrder,
  retryOrder,
  updateOrderPriority,
  getQueuePosition,
  getSchedulerStats,
};
