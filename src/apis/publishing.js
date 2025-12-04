/**
 * Workflow Publishing API
 * 工作流发布 - 将工作流发布为公共 API 端点供外部调用
 */

import { http } from './interceptor';

/**
 * Publish workflow
 * 将工作流发布为公共 API 端点，生成唯一的访问地址供外部系统调用
 * @param {string} id
 * @param {Object} data
 * @returns {Promise}
 */
export function publishWorkflow(id, data) {
  return http.post(`/workflows/${id}/publish`, data);
}

/**
 * Unpublish workflow
 * 撤销工作流的发布状态，移除公共 API 端点
 * @param {string} id
 * @returns {Promise}
 */
export function unpublishWorkflow(id) {
  return http.post(`/workflows/${id}/unpublish`);
}

/**
 * Get published workflows
 * 查询所有已发布的工作流，支持按分类筛选
 * @param {string} [category]
 * @returns {Promise}
 */
export function getPublishedWorkflows(category) {
  return http.get('/workflows/published', {
    params: category ? { category } : undefined,
  });
}

/**
 * Get workflow form schema
 * 获取已发布工作流的输入参数表单定义，用于动态生成前端表单
 * @param {string} id
 * @returns {Promise}
 */
export function getFormSchema(id) {
  return http.get(`/workflows/${id}/form-schema`);
}

export default {
  publishWorkflow,
  unpublishWorkflow,
  getPublishedWorkflows,
  getFormSchema,
};
