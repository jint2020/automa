/**
 * Throw Order Trigger API
 * 甩单触发器 - 接收外部系统甩单，触发工作流执行
 */

import { http } from './interceptor';

/**
 * Receive throw order
 * 接收外部系统的甩单请求，根据业务名称触发对应工作流
 * @param {Object} data
 * @returns {Promise}
 */
export function receiveOrder(data) {
  return http.post('/throw-order', data);
}

/**
 * Receive batch throw orders
 * 批量接收外部系统的甩单请求
 * @param {Array} data
 * @returns {Promise}
 */
export function receiveBatchOrders(data) {
  return http.post('/throw-order/batch', data);
}

/**
 * Receive legacy format order
 * 兼容旧系统的甩单接口格式
 * @param {Object} data
 * @returns {Promise}
 */
export function receiveLegacyOrder(data) {
  return http.post('/throw-order/legacy', data);
}

export default {
  receiveOrder,
  receiveBatchOrders,
  receiveLegacyOrder,
};
